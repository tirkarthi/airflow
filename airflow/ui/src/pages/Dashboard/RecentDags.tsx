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
import {
  Box,
  Heading,
  Flex,
  Stack,
  VStack,
  Text,
  Skeleton,
} from "@chakra-ui/react";
import { FiClock } from "react-icons/fi";
import { Link } from "react-router-dom";

import { useDagsServiceRecentDagRuns } from "openapi/queries";
import { RecentRuns } from "src/pages/DagsList/RecentRuns";

const RecentDag = ({ dagId }: { readonly dagId: string }) => {
  const { data, isLoading } = useDagsServiceRecentDagRuns({ dagIds: [dagId] });

  return isLoading ? (
    <Skeleton height={100} width={400} />
  ) : (
    <VStack
      borderColor="border.emphasized"
      borderRadius={5}
      borderWidth={1}
      width="full"
    >
      <Flex flexDirection="row-reverse" mr={2} mt={2} width="full">
        <RecentRuns latestRuns={data?.dags[0]?.latest_dag_runs ?? []} />
      </Flex>
      <Box
        backgroundColor="bg.info"
        borderRadius={5}
        pl={2}
        py={2}
        width="full"
      >
        <Link to={`/dags/${dagId}`}>
          <Text color="fg.info" truncate>
            {dagId}
          </Text>
        </Link>
      </Box>
    </VStack>
  );
};

export const RecentDags = () => {
  const RecentlyViewedDagsKey = "RecentlyViewedDags";
  const RecentlyViewedDags: Array<string> = JSON.parse(
    localStorage.getItem(RecentlyViewedDagsKey) ?? "",
  ) as Array<string>;

  return (
    <Box>
      <Flex color="fg.muted" my={2}>
        <FiClock />
        <Heading ml={1} size="xs">
          Recently Viewed Dags
        </Heading>
      </Flex>
      <Stack direction={{ base: "column", md: "row" }} mr={2}>
        {RecentlyViewedDags.map((dagId) => (
          <RecentDag dagId={dagId} key={dagId} />
        ))}
      </Stack>
    </Box>
  );
};
