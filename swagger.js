const swaggerJsdoc = require('swagger-jsdoc');
const options = {
  apis: ['./iMessage'],
  basePath: '/',
  swaggerDefinition: {
    info: {
      description: 'API to trigger iMessage commands',
      swagger: '2.0',
      title: 'iMessage API',
      version: '1.0.0'
    }
  }
};
var specs = swaggerJsdoc(options);
module.exports = specs;