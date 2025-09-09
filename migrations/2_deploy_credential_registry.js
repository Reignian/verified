const CredentialRegistry = artifacts.require("CredentialRegistry");

module.exports = function (deployer) {
  deployer.deploy(CredentialRegistry);
};
