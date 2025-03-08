const akaHook = async () => {
    try {
        return new Response(
            JSON.stringify({ message: "here we are" }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (e) {
        console.error(e);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

export default akaHook;