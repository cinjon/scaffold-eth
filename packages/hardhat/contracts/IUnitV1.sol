interface IUnitV1 {
  function addParents ( address[] memory newParentAddresses, uint256[] memory newParentSupplies ) external;
  function airdrop (  ) external;
  function owner (  ) external view returns ( address );
  function renounceOwnership (  ) external;
  function transferOwnership ( address newOwner ) external;
}
