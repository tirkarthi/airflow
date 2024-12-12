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
import { Box, Heading, Flex, HStack, VStack, Text } from "@chakra-ui/react";
import { FiClipboard } from "react-icons/fi";

import { useDagsServiceRecentDagRuns } from "openapi/queries";
import { RecentRuns } from "src/pages/DagsList/RecentRuns";

const RecentDagsList = [
  "example_complex",
  "example_task_group",
  "example_branch_datetime_operator",
  "tutorial",
  "example_xcom",
  "example_complex",
];

const RecentDag = ({ dagId }: { dagId: string }) => {
  const { data, isLoading } = useDagsServiceRecentDagRuns({ dagIds: [dagId] });

  if (!isLoading) {
    return (
      <VStack width={400}>
        <Flex width="full" flexDirection="row-reverse">
          <RecentRuns latestRuns={data?.dags[0].latest_dag_runs} />
        </Flex>
        <Box
          backgroundColor="bg.info"
          color="fg.info"
          width="full"
          px={2}
          py={1}
          pr={50}
          borderRadius={5}
        >
          {dagId}
        </Box>
      </VStack>
    );
  } else {
    return <>loading</>;
  }
};

export const RecentDags = () => {
  const RecentlyViewedDagsKey = "RecentlyViewedDags";
  let RecentlyViewedDags = JSON.parse(
    localStorage.getItem(RecentlyViewedDagsKey),
  );

  return (
    <Box>
      <Flex color="fg.muted" my={2}>
        <FiClipboard />
        <Heading ml={1} size="xs">
          Recently Viewed Dags
        </Heading>
      </Flex>
      <HStack>
        {RecentlyViewedDags.map((dag) => (
          <RecentDag dagId={dag} />
        ))}
      </HStack>
    </Box>
  );
};
