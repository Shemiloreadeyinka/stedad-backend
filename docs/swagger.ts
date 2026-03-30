const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const doc = {
  openapi: "3.0.0",
  info: {
    title: "Stedad APIs",
    description: "API for managing Stedad app",
    version: "1.0.0",
  },
  host: "localhost:5000",
  basePath: "/",
  schemes: ["http", "https"],
  tags: [
    { name: "Authentication", description: "Endpoints for login and logout" },
    { name: "Staff", description: "Endpoints for managing staff" },
    { name: "Products", description: "Endpoints for managing products" },
    { name: "Sales", description: "Endpoints for managing sales" },
    { name: "Customers", description: "Endpoints for managing customers" },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const outputFile = "./docs/swagger.json";
const endpointsFiles = ["../src/app.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);
