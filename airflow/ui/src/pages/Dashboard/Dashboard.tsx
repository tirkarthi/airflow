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
import { Box, Heading, Button } from "@chakra-ui/react";
import { useTour } from "@reactour/tour";
import { useEffect, useState } from "react";
import Joyride from "react-joyride";

import { Health } from "./Health";
import { HistoricalMetrics } from "./HistoricalMetrics";
import { Stats } from "./Stats";

const steps_ = [
  {
    target: ".health-section",
    content: "Shows the health of the Airflow cluster.",
    disableBeacon: true,
    showProgress: true,
    disableScrolling: true,
  },
  {
    target: ".historical-metrics-section",
    content: "Shows the historical metrics of the Airflow cluster.",
    disableBeacon: true,
    showProgress: true,
    disableScrolling: true,
  },
];

export const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState([]);

  useEffect(() => setSteps(steps_));

  return (
    <Box>
      <Joyride steps={steps} run={isOpen} continuous={true} />
      <Heading mb={4}>Welcome</Heading>
      <Button
        mb={4}
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Start Tour
      </Button>
      <Box>
        <Health />
      </Box>
      <Box mt={5}>
        <HistoricalMetrics />
      </Box>
    </Box>
  );
};
