export const handler = async (event: any) => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Auth Lambda function is live!",
        input: event,
      }),
    };
  };
  