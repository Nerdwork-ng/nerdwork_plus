import app from "./server";

// For local development only
if (process.env.NODE_ENV !== "production" && require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}

export default app;
