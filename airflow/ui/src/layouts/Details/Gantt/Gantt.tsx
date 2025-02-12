/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Box, Flex } from "@chakra-ui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  TimeScale,
} from "chart.js";
import "chart.js/auto";
import "chartjs-adapter-dayjs-4";
import annotationPlugin from "chartjs-plugin-annotation";
import dayjs from "dayjs";
import { Bar } from "react-chartjs-2";
import { useParams } from "react-router-dom";

import { useDagRunServiceGetDagRun, useTaskInstanceServiceGetTaskInstances } from "openapi/queries";
import type { TaskInstanceResponse } from "openapi/requests/types.gen";
import { useTimezone } from "src/context/timezone";
import { system } from "src/theme";
import { getDuration } from "src/utils/datetime_utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  Filler,
  Tooltip,
  annotationPlugin,
  TimeScale,
);

export const Gantt = () => {
  const { dagId, runId } = useParams();
  const { selectedTimezone } = useTimezone();

  const { data: dagRun } = useDagRunServiceGetDagRun(
    {
      dagId,
      dagRunId: runId,
    },
    undefined,
    {
      enabled: Boolean(runId),
    },
  );

  const { data: taskInstances, isLoading } = useTaskInstanceServiceGetTaskInstances(
    {
      dagId,
      dagRunId: runId,
      orderBy: "start_date",
    },
    undefined,
    {
      enabled: Boolean(runId),
    },
  );

  if (isLoading || taskInstances === undefined || runId === undefined) {
    return undefined;
  }

  const data = taskInstances.task_instances.map((ti: TaskInstanceResponse) => ({
    x: [
      // ti.start_date,
      // ti.end_date
      dayjs(ti?.start_date).tz(selectedTimezone).format("YYYY-MM-DD HH:mm:ss"),
      dayjs(ti?.end_date).tz(selectedTimezone).format("YYYY-MM-DD HH:mm:ss"),
    ],
    y: ti.task_id,
  }));

  return (
    <Flex maxH="calc(90vh)" width="90%">
      <Bar
        data={{
          datasets: [
            {
              backgroundColor: taskInstances.task_instances.map(
                (ti: TaskInstanceResponse) =>
                  system.tokens.categoryMap.get("colors")?.get(`${ti.state}.600`)?.value,
              ),
              data,
              maxBarThickness: 30,
            },
          ],
          labels: [],
        }}
        datasetIdKey="id"
        options={{
          indexAxis: "y",
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label(tooltipItem) {
                  const { label } = tooltipItem;

                  return label;
                },
                title(tooltipItems) {
                  const startDate = dayjs(tooltipItems[0]?.raw[0])
                    .tz(selectedTimezone)
                    .format("YYYY-MM-DD HH:mm:ss");
                  const endDate = dayjs(tooltipItems[0]?.raw[1])
                    .tz(selectedTimezone)
                    .format("YYYY-MM-DD HH:mm:ss");
                  const duration = getDuration(startDate, endDate);

                  return `
Start Date: ${startDate}
End Date: ${endDate}
Duration: ${duration} seconds
`;
                },
              },
            },
          },
          responsive: true,
          scales: {
            x: {
              max: dayjs(dagRun?.end_date).tz(selectedTimezone).format("YYYY-MM-DD HH:mm:ss") ?? dayjs(),
              min: dayjs(dagRun?.start_date).tz(selectedTimezone).format("YYYY-MM-DD HH:mm:ss") ?? dayjs(),
              stacked: true,
              ticks: {
                maxTicksLimit: 3,
              },
              title: { align: "end", display: true, text: "Time" },
              type: "time",
            },

            y: {
              title: { align: "end", display: true, text: "Task" },
            },
          },
        }}
      />
    </Flex>
  );
};
