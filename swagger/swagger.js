const swagerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: "HRMS API",
    description: "API documentation for your project",
  },
  host: "192.168.0.158:5000",
  schemes: ["http"],

  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter: Bearer <token>",
    },
  },

  security: [
    {
      BearerAuth: [],
    },
  ],
};

const outputFile = "./swagger/swagger-output.json";

const endpointsFiles = [
  "../app.js",
  "./src/routes/index.js", 
];

swagerAutogen(outputFile, endpointsFiles, doc);