const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../../swagger/swagger-output.json");

exports. swaggerMiddleware = [
    swaggerUi.serve,
    swaggerUi.setup(swaggerFile),
]