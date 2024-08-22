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

/* global document */

import React from "react";
import { createRoot } from "react-dom/client";
import createCache from "@emotion/cache";
import { motion, AnimatePresence } from "framer-motion";
import AutoRefresh from "src/components/AutoRefresh";
import { AutoRefreshProvider } from "../context/autorefresh";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Text,
  Stack,
  StackDivider,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Box,
  Flex,
  Spacer,
  Heading,
  Link,
  SimpleGrid,
  Center,
  ExternalLinkIcon,
  RadioGroup,
  Radio,
  useRadioGroup,
} from "@chakra-ui/react";

import { formatDuration, getDuration } from "src/datetime_utils";
import { useDashboard } from "src/api";
import App from "src/App";

// create shadowRoot
const root = document.querySelector("#root");
const shadowRoot = root?.attachShadow({ mode: "open" });
const cache = createCache({
  container: shadowRoot,
  key: "c",
});
const mainElement = document.getElementById("react-container");

function PlannedDagRun(items) {
  let rows = [];
  if (items === undefined) {
    items = [];
  }

  let count = items.length;

  return (
    <Box>
      <Center>
        {" "}
        <Text> Upcoming - {count} </Text>{" "}
      </Center>
      <Box paddingTop="10px" marginTop="10px" height="90vh" overflowY="scroll">
        <motion.div>
          <AnimatePresence>
            {items.map((item, index) => {
              return (
                <Card
                  as={motion.div}
                  borderLeftWidth="5px"
                  margin="10px"
                  size="md"
                  enter={{ duration: 10 }}
                  initial={{ opacity: 0, y: "-100%" }}
                  animate={{ opacity: 1, y: "10%" }}
                  exit={{ opacity: 0, x: "10%" }}
                  transition="0.5s linear"
                  key={`${item.dagId}-${item.nextDagrunCreateAfter}`}
                >
                  <CardHeader mb={0} pb={0}>
                    <Text>
                      {" "}
                      <Link
                        href={encodeURI(`/dags/${item.dagId}/grid`)}
                        wrap="yes"
                      >
                        {" "}
                        {item.dagId}{" "}
                      </Link>{" "}
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <Text>Start at : {item.nextDagrunCreateAfter} </Text>
                    <Text>
                      {" "}
                      Schedule :{" "}
                      {item.timetableDescription || item.scheduleInterval}{" "}
                    </Text>
                  </CardBody>
                </Card>
              );
            })}
            ;
          </AnimatePresence>
        </motion.div>
      </Box>
    </Box>
  );
}

function TaskInstanceStatus(state, items) {
  let rows = [];
  let color = stateColors.running;

  if (state === "deferred") {
    color = stateColors.deferred;
  } else if (state === "failed") {
    color = stateColors.failed;
  } else if (state === "success") {
    color = stateColors.success;
  }

  if (items === undefined) {
    items = [];
  }

  let count = items.length;

  return (
    <Box>
      <Center>
        {" "}
        <Text>
          {" "}
          {state} - {count}{" "}
        </Text>{" "}
      </Center>

      <Box mt={2} height="90vh" overflowY="scroll">
        <motion.div>
          <AnimatePresence>
            {items.map((item, index) => {
              return (
                <Card
                  as={motion.div}
                  borderLeftWidth="5px"
                  borderLeftColor={color}
                  margin="10px"
                  size="md"
                  enter={{ duration: 10 }}
                  initial={{ opacity: 0, y: "-100%" }}
                  animate={{ opacity: 1, y: "10%" }}
                  exit={{ opacity: 0, x: "10%" }}
                  transition="0.5s linear"
                  key={`${item.dagId}.${item.runId}.${item.taskId}.${item.mapIndex}`}
                >
                  <CardHeader mb={0} pb={0}>
                    <Text>
                      {" "}
                      <Link
                        href={`/dags/${
                          item.dagId
                        }/grid?dag_run_id=${encodeURIComponent(
                          item.runId
                        )}&task_id=${item.taskId}`}
                        wrap="yes"
                      >
                        {" "}
                        {item.taskId}{" "}
                      </Link>{" "}
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <Text>
                      Dag ID :
                      <Link
                        href={encodeURI(`/dags/${item.dagId}/grid`)}
                        wrap="yes"
                      >
                        {" "}
                        {item.dagId}{" "}
                      </Link>{" "}
                    </Text>

                    <Text>Started : {item.startDate} </Text>
                    {item.endDate && <Text>Ended : {item.endDate} </Text>}
                    <Text>
                      Duration :{" "}
                      {formatDuration(
                        getDuration(item.startDate, item.endDate)
                      )}{" "}
                    </Text>
                  </CardBody>
                </Card>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </Box>
    </Box>
  );
}

function DagRunStatus(state, items) {
  let rows = [];
  let color = stateColors.running;

  if (state === "failed") {
    color = stateColors.failed;
  } else if (state === "success") {
    color = stateColors.success;
  }

  if (items === undefined) {
    items = [];
  }
  const count = items.length;

  return (
    <Box>
      <Center>
        {" "}
        <Text>
          {" "}
          {state} - {count}{" "}
        </Text>{" "}
      </Center>

      <Box mt={2} height="90vh" overflowY="scroll">
        <motion.div>
          <AnimatePresence>
            {items.map((item, index) => {
              return (
                <Card
                  as={motion.div}
                  borderLeftWidth="5px"
                  borderLeftColor={color}
                  margin="10px"
                  size="md"
                  enter={{ duration: 10 }}
                  initial={{ opacity: 0, y: "-100%" }}
                  animate={{ opacity: 1, y: "10%" }}
                  exit={{ opacity: 0, x: "10%" }}
                  transition="0.5s linear"
                  key={`${item.dagId}.${item.runId}.${index}`}
                >
                  <CardHeader mb={0} pb={0}>
                    <Text>
                      <Link
                        href={encodeURI(`/dags/${item.dagId}/grid`)}
                        wrap="yes"
                      >
                        {" "}
                        {item.dagId}{" "}
                      </Link>{" "}
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <Text>
                      Run ID:{" "}
                      <Link
                        href={`/dags/${
                          item.dagId
                        }/grid?dag_run_id=${encodeURIComponent(item.runId)}`}
                        wrap="yes"
                      >
                        {" "}
                        {item.runId}{" "}
                      </Link>{" "}
                    </Text>

                    <Text>Started : {item.startDate} </Text>
                    {item.endDate && <Text>Ended : {item.endDate} </Text>}
                    <Text>
                      Duration :{" "}
                      {formatDuration(
                        getDuration(item.startDate, item.endDate)
                      )}{" "}
                    </Text>
                  </CardBody>
                </Card>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </Box>
    </Box>
  );
}

function Dashboard() {
  const [duration, setDuration] = React.useState("8");

  const { data, isError } = useDashboard(duration);

  if (data) {
    return (
      <Flex
        alignItems="flex-start"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Flex minWidth="100%" alignItems="center">
          <Heading mt={3} mb={2} fontWeight="normal" size="lg">
            Dashboard
          </Heading>
          <Spacer />
          <RadioGroup
            defaultValue="8"
            pr={5}
            onChange={setDuration}
            value={duration}
          >
            <Stack spacing={5} direction="row">
              <Radio colorScheme="green" value="1">
                1 hour
              </Radio>
              <Radio colorScheme="green" value="8">
                8 hours
              </Radio>
              <Radio colorScheme="green" value="24">
                24 hours
              </Radio>
            </Stack>
          </RadioGroup>
          <AutoRefresh />
        </Flex>

        <Heading mt={3} mb={2} fontWeight="normal" size="lg">
          Task Instances
        </Heading>

        <SimpleGrid columns="4" spacing={5} width="100%">
          {TaskInstanceStatus("running", data["taskInstances"]["running"])}
          {TaskInstanceStatus("deferred", data["taskInstances"]["deferred"])}
          {TaskInstanceStatus("success", data["taskInstances"]["success"])}
          {TaskInstanceStatus("failed", data["taskInstances"]["failed"])}
        </SimpleGrid>

        <Heading mt={3} mb={2} fontWeight="normal" size="lg">
          Dag Runs
        </Heading>

        <SimpleGrid columns="4" spacing={5} width="100%" pb={5} mb={5}>
          {PlannedDagRun(data["upcomingDagRuns"])}
          {DagRunStatus("running", data["dagRunsCurrent"]["running"])}
          {DagRunStatus("success", data["dagRunsCurrent"]["success"])}
          {DagRunStatus("failed", data["dagRunsCurrent"]["failed"])}
        </SimpleGrid>

        <Text m={2}>
          {" "}
          This page is experimental. UI is subjected to change and might contain
          bugs.
        </Text>
      </Flex>
    );
  }
}

export default Dashboard;

if (mainElement) {
  shadowRoot?.appendChild(mainElement);
  const reactRoot = createRoot(mainElement);
  reactRoot.render(
    <App cache={cache}>
      <AutoRefreshProvider>
        <Dashboard />
      </AutoRefreshProvider>
    </App>
  );
}
