import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const handleLogin = () => {
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log("Login successful");
    })
    .catch((error) => {
      setErrorMessage(error.message);
    });
};
