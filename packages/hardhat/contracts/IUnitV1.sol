interface IUnitV1 {
  function addParents ( address[] newParentAddresses, uint256[] newParentSupplies ) external;
  function airdrop (  ) external;
  function owner (  ) external view returns ( address );
  function renounceOwnership (  ) external;
  function transferOwnership ( address newOwner ) external;
}
