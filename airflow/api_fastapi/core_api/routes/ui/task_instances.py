# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

from __future__ import annotations

from sqlalchemy import and_, func, select

from airflow.api_fastapi.common.db.common import (
    SessionDep,
    paginated_select,
)
from airflow.api_fastapi.common.router import AirflowRouter
from airflow.api_fastapi.core_api.datamodels.task_instances import TaskInstanceDurationCollectionResponse
from airflow.models import TaskInstance
from airflow.utils.state import TaskInstanceState

task_instances_router = AirflowRouter(prefix="/task_instances", tags=["Task Instances"])


@task_instances_router.get(
    "/recent_task_instances", include_in_schema=False, response_model_exclude_none=True
)
def recent_task_instances(
    dag_id: str,
    session: SessionDep,
    state: TaskInstanceState | None = None,
) -> TaskInstanceDurationCollectionResponse:
    """Get recent task instances for a dag."""
    task_instances_limit = 14

    recent_task_instances_subquery = select(
        TaskInstance.task_id,
        TaskInstance.dag_id,
        TaskInstance.start_date,
        TaskInstance.end_date,
        TaskInstance.state,
        TaskInstance.try_number,
        func.rank()
        .over(
            partition_by=TaskInstance.task_id,
            order_by=TaskInstance.start_date,
        )
        .label("rank"),
    ).subquery()

    recent_task_instances_select = select(recent_task_instances_subquery).where(
        and_(
            recent_task_instances_subquery.c.rank <= task_instances_limit,
            recent_task_instances_subquery.c.dag_id == dag_id,
            *([recent_task_instances_subquery.c.state == state] if state else []),
        )
    )

    recent_task_instances_select_filter, total_entries = paginated_select(
        statement=recent_task_instances_select,
    )

    recent_task_instances = session.execute(recent_task_instances_select_filter)

    return TaskInstanceDurationCollectionResponse(
        total_entries=total_entries,
        task_instances=recent_task_instances,
    )
