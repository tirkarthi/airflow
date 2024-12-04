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

import pytest

from airflow.utils.session import provide_session

from tests.api_fastapi.core_api.routes.public.test_task_instances import (
    TestTaskInstanceEndpoint as TestPublicTaskInstanceEndpoint,
)

pytestmark = pytest.mark.db_test
DAG_ID = "example_python_operator"


class TestRecentTaskInstances(TestPublicTaskInstanceEndpoint):
    @pytest.fixture(autouse=True)
    @provide_session
    def setup_dag_runs(self, session=None) -> None:
        self.tis = self.create_task_instances(session)
        self.tis[0].state = "failed"
        session.merge(self.tis[0])
        session.commit()

    @pytest.mark.parametrize(
        "query_params, expected_dag_id,expected_total_task_instances",
        [
            # Search
            ({"dag_id": DAG_ID}, DAG_ID, 9),
            ({"dag_id": DAG_ID, "state": "success"}, None, 0),
            ({"dag_id": DAG_ID, "state": "failed"}, DAG_ID, 1),
            ({"dag_id": "invalid"}, None, 0),
        ],
    )
    def test_recent_dag_runs(self, test_client, query_params, expected_dag_id, expected_total_task_instances):
        response = test_client.get("/ui/task_instances/recent_task_instances", params=query_params)
        assert response.status_code == 200
        body = response.json()

        assert body["total_entries"] == expected_total_task_instances
        assert all(ti["dag_id"] == expected_dag_id for ti in body["task_instances"])
