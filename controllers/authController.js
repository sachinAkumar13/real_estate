const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const hashPassword = async (password) => {
    try {
      // Hash the password with 10 salt rounds
      const hashedPassword = await bcrypt.hash(password, 10);
      return hashedPassword;
    } catch (error) {
      console.error("Error hashing password:", error);
      throw error;
    }
  };
  

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await userModel.findUserByEmail(email);

    if (user) return res.status(400).json({ msg: "User already exists" });

    // const hashedPassword = await bcrypt.hash(password, 6);
    const hashedPassword = password;

    // console.log(hashedPassword);
    await userModel.createUser(name, email, hashedPassword);

    res.json({ msg: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
