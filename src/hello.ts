exports.handler = async (event: unknown) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda v1!'),
    };
    return response;
};
