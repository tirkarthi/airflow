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
  Heading,
  Link,
  SimpleGrid,
  Center,
  ExternalLinkIcon,
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

  for (var i = 0; i < count; i++) {
    rows.push(
      <Card borderLeftWidth="5px" margin="10px" size="md" key={i}>
        <CardHeader mb={0} pb={0}>
          <Text>
            {" "}
            <Link href={encodeURI(`/dags/${items[i].dagId}/grid`)} wrap="yes">
              {" "}
              {items[i].dagId}{" "}
            </Link>{" "}
          </Text>
        </CardHeader>
        <CardBody>
          <Text>Start at : {items[i].nextDagrunCreateAfter} </Text>
          <Text>Schedule : {items[i].timetableDescription} </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box mt={50} pb={5} mb={5}>
      <Center>
        {" "}
        <Text> Upcoming DagRuns - {count} </Text>{" "}
      </Center>
      <Box paddingTop="10px" marginTop="10px" height="90vh" overflowY="scroll">
        {rows}
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

  for (var i = 0; i < count; i++) {
    rows.push(
      <Card
        borderLeftWidth="5px"
        borderLeftColor={color}
        margin="10px"
        size="md"
        key={i}
      >
        <CardHeader mb={0} pb={0}>
          <Text>
            {" "}
            <Link
              href={`/dags/${
                items[i].dagId
              }/grid?dag_run_id=${encodeURIComponent(items[i].runId)}&task_id=${
                items[i].taskId
              }`}
              wrap="yes"
            >
              {" "}
              {items[i].taskId}{" "}
            </Link>{" "}
          </Text>
        </CardHeader>
        <CardBody>
          <Text>
            Dag ID :
            <Link href={encodeURI(`/dags/${items[i].dagId}/grid`)} wrap="yes">
              {" "}
              {items[i].dagId}{" "}
            </Link>{" "}
          </Text>

          <Text>Started : {items[i].startDate} </Text>
          {items[i].endDate && <Text>Ended : {items[i].endDate} </Text>}
          <Text>
            Duration :{" "}
            {formatDuration(getDuration(items[i].startDate, items[i].endDate))}{" "}
          </Text>
        </CardBody>
      </Card>
    );
  }

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
                  initial={{ opacity: 0, y: "-100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{
                    exit: { opacity: 0, delay: 1 },
                    enter: { duration: 1 },
                    initial: { opacity: 0, y: "-100%" },
                    animate: { opacity: 1, y: 0 },
                  }}
                  transition="0.5s linear"
                  key={`${item.dagId}.${item.runId}.${item.taskId}`}
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

function Dashboard() {
  const { data, isError } = useDashboard();

  if (data) {
    return (
      <Flex
        alignItems="flex-start"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Heading mt={3} mb={2} fontWeight="normal" size="lg">
          Dashboard
        </Heading>

        <SimpleGrid columns="4" spacing={5} width="100%">
          {TaskInstanceStatus("running", data["taskInstances"]["running"])}
          {TaskInstanceStatus("deferred", data["taskInstances"]["deferred"])}
          {TaskInstanceStatus("success", data["taskInstances"]["success"])}
          {TaskInstanceStatus("failed", data["taskInstances"]["failed"])}
        </SimpleGrid>

        {PlannedDagRun(data["dagRuns"])}

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
      <Dashboard />
    </App>
  );
}
