import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { createUser, getUserByuserName } from "../services/user.services.js";
import { response } from "express";

const generatePassword = async (password) => {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(typeof hashedPassword);
  return hashedPassword;
};

async function createUserCtr(req, res) {
  const data = req.body;
  const password = data.password;
  if (data.password.length < 8) {
    res.status(400).send({ msg: "password is too short" });
    return;
  }
  const userFromDB = await getUserByuserName(data.userName);
  if (userFromDB.data) {
    res.status(400).send({ msg: "user already exists" });
    return;
  }
  const hashedPassword = await generatePassword(password);
  const hasheddata = {
    userName: data.userName,
    password: hashedPassword,
  };
  try {
    await createUser(hasheddata);
    res.status(201).send(hasheddata);
    console.log(hasheddata);
  } catch (err) {
    console.log(err);
    res.send({ msg: "unable to create" });
  }
}

async function logicUserCtr(req, res) {
  const data = req.body;
  const userFromDB = await getUserByuserName(data.userName);
  if (!userFromDB.data) {
    res.status(404).send({ msg: "Invalid Credentials" });
    return;
  } else {
    const storedDBPassword = userFromDB.data.password;
    const providedPassword = data.password;
    const isPasswordCheck = await bcrypt.compare(
      providedPassword,
      storedDBPassword
    );
    if (isPasswordCheck) {
      var token = jwt.sign(
        { foo: userFromDB.data.userName },
        process.env.SECRET_KEY
      );

      res.status(200).send({ msg: "Login Successful", token });
    } else {
      res.status(400).send({ msg: "Invalid Credentials" });
    }
  }
}

export { createUserCtr, logicUserCtr };
