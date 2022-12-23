const express = require("express");
const connectDB = require("./config/db");
const userRouter = require("./routes/api/users");
const profileRouter = require("./routes/api/profile");
const postRouter = require("./routes/api/posts");
const authRouter = require("./routes/api/auth");

const app = express();

//connect database
connectDB();

//middleware
app.use(express.json());

app.get("/", (req, res) => res.send("API running..."));

//define routes
app.use("/api/users", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/posts", postRouter);
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 5010;

app.listen(PORT, () => console.log(`server listening on port: ${PORT}`));
