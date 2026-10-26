// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title IReceiver - receives Chainlink CRE (Keystone) reports via the forwarder.
/// @notice Interface as published in the Chainlink CRE docs ("Building Consumer Contracts").
interface IReceiver is IERC165 {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
