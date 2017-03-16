const ExtendableError = require('es6-error')

class UnacceptableTemplateFunctionError extends ExtendableError {}
class MissingIdError extends ExtendableError {}
class InvalidAttributesDefinitionError extends ExtendableError {}
class PoorlyDefinedRelationshipError extends ExtendableError {}

module.exports = {
  UnacceptableTemplateFunctionError,
  MissingIdError,
  InvalidAttributesDefinitionError,
  PoorlyDefinedRelationshipError
}
