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
import { useQuery } from "@tanstack/react-query";
import ELK, { type ElkNode, type ElkExtendedEdge, type ElkShape } from "elkjs";

import type { Node } from "./data";
import type { EdgeResponse, NodeResponse, NodeValueResponse } from "openapi/requests/types.gen";
import { flattenGraph, formatFlowEdges } from "./reactflowUtils";

type EdgeLabel = {
  height: number;
  id: string;
  text: string;
  width: number;
};

type FormattedNode = {
  childCount?: number;
  edges?: Array<FormattedEdge>;
  isGroup: boolean;
  isMapped?: boolean | null;
  isOpen?: boolean;
  setupTeardownType?: Node["setup_teardown_type"] | null;
} & ElkShape &
  NodeValueResponse;

type FormattedEdge = {
  id: string;
  isSetupTeardown?: boolean | null;
  labels?: Array<EdgeLabel>;
  parentNode?: string;
} & ElkExtendedEdge;

export type LayoutNode = ElkNode & Node;

// Take text and font to calculate how long each node should be
const getTextWidth = (text: string, font: string) => {
  const context = document.createElement("canvas").getContext("2d");

  if (context) {
    context.font = font;
    const metrics = context.measureText(text);

    return metrics.width;
  }

  return text.length * 9;
};

const getDirection = (arrange: string) => {
  switch (arrange) {
    case "BT":
      return "UP";
    case "RL":
      return "LEFT";
    case "TB":
      return "DOWN";
    default:
      return "RIGHT";
  }
};

const formatElkEdge = (
  edge: EdgeResponse,
  font: string,
  node?: NodeResponse,
): FormattedEdge => ({
  id: `${edge.source_id}-${edge.target_id}`,
  isSetupTeardown: edge.is_setup_teardown,
  // isSourceAsset: e.isSourceAsset,
  labels:
    edge.label === null
      ? []
      : [
          {
            height: 16,
            id: edge.label,
            text: edge.label,
            width: getTextWidth(edge.label, font),
          },
        ],
  parentNode: node?.id ?? "",
  sources: [edge.source_id],
  targets: [edge.target_id],
});

const getNestedChildIds = (children: Array<Node>) => {
  let childIds: Array<string> = [];

  children.forEach((child) => {
    childIds.push(child.id);
    if (child.children) {
      const nestedChildIds = getNestedChildIds(child.children);

      childIds = [...childIds, ...nestedChildIds];
    }
  });

  return childIds;
};

type GenerateElkProps = {
  arrange: string;
  edges: Array<EdgeResponse>;
  font: string;
  nodes: NodeResponse;
  openGroupIds?: Array<string>;
};

const generateElkGraph = ({
  arrange,
  edges: unformattedEdges,
  font,
  nodes,
  openGroupIds,
}: GenerateElkProps): ElkNode => {
  const closedGroupIds: Array<string> = [];
  let filteredEdges = unformattedEdges;

  const formatChildNode = (node: NodeResponse): FormattedNode => {
    const isOpen = openGroupIds?.includes(node.id);

    const childCount =
      node.children?.filter((child) => child.type !== "join").length ?? 0;
    const childIds =
      node.children === null ? [] : getNestedChildIds(node.children);

    if (isOpen && node.children !== null) {
      return {
        ...node,
        childCount,
        children: node.children.map(formatChildNode),
        edges: filteredEdges
          .filter((edge) => {
            if (
              childIds.includes(edge.source_id) &&
              childIds.includes(edge.target_id)
            ) {
              // Remove edge from array when we add it here
              filteredEdges = filteredEdges.filter(
                (fe) =>
                  !(
                    fe.source_id === edge.source_id &&
                    fe.target_id === edge.target_id
                  ),
              );

              return true;
            }

            return false;
          })
          .map((edge) => formatElkEdge(edge, font, node)),
        id: node.id,
        isGroup: true,
        isOpen,
        label: node.value.label,
        layoutOptions: {
          "elk.padding": "[top=80,left=15,bottom=15,right=15]",
        },
      };
    }

    if (!Boolean(isOpen) && node.children !== undefined) {
      filteredEdges = filteredEdges
        // Filter out internal group edges
        .filter(
          (fe) =>
            !(
              childIds.includes(fe.source_id) && childIds.includes(fe.target_id)
            ),
        )
        // For external group edges, point to the group itself instead of a child node
        .map((fe) => ({
          ...fe,
          source_id: childIds.includes(fe.source_id) ? node.id : fe.source_id,
          target_id: childIds.includes(fe.target_id) ? node.id : fe.target_id,
        }));
      closedGroupIds.push(node.id);
    }

    const label = node.value.isMapped
      ? `${node.value.label} [100]`
      : node.value.label;
    const labelLength = getTextWidth(label, font);
    const width = labelLength > 200 ? labelLength : 200;
    const height = 80;

    // TODO: Fix after node.type is present
    // if (node.type === "join") {
    //   width = 10;
    //   height = 10;
    // } else if (node.type === "asset_condition") {
    //   width = 30;
    //   height = 30;
    // }

    return {
      childCount,
      height,
      id: node.id,
      isGroup: Boolean(node.children),
      isMapped: node.value.isMapped,
      label: node.value.label,
      setupTeardownType: node.value.setupTeardownType,
      type: "task",
      width,
    };
  };

  const children = nodes.children?.map(formatChildNode);

  const edges = filteredEdges.map((fe) => formatElkEdge(fe, font));

  return {
    children,
    edges,
    id: "root",
    layoutOptions: {
      "elk.core.options.EdgeLabelPlacement": "CENTER",
      "elk.direction": getDirection(arrange),
      hierarchyHandling: "INCLUDE_CHILDREN",
      "spacing.edgeLabel": "10.0",
    },
  };
};

type LayoutProps = {
  arrange?: string;
  edges: Array<EdgeResponse>;
  nodes: NodeResponse;
  openGroupIds: Array<string>;
};

export const useGraphLayout = ({
  arrange = "LR",
  edges,
  nodes,
  openGroupIds = [],
}: LayoutProps) =>
  useQuery({
    enabled: Boolean(nodes),
    queryFn: async () => {
      const font = `bold 16px ${
        globalThis.getComputedStyle(document.body).fontFamily
      }`;
      const elk = new ELK();

      // 1. Format graph data to pass for elk to process
      const graph = generateElkGraph({
        arrange,
        edges,
        font,
        nodes,
        openGroupIds,
      });
      // 2. use elk to generate the size and position of nodes and edges
      const data = (await elk.layout(graph)) as LayoutNode;

      // 3. Flatten the nodes and edges for xyflow to actually render the graph
      const flattenedData = flattenGraph({
        children: data.children,
      });

      // merge & dedupe edges
      const flatEdges = [...(data.edges ?? []), ...flattenedData.edges].filter(
        (value, index, self) =>
          index === self.findIndex((edge) => edge.id === value.id),
      );

      const formattedEdges = formatFlowEdges({ edges: flatEdges });

      return { edges: formattedEdges, nodes: flattenedData.nodes };
    },
    queryKey: ["graphLayout", nodes?.children?.length, openGroupIds, arrange],
  });
