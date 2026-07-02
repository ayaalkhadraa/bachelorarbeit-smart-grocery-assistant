import express from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import {
  findUserByEmail,
  createUser,
  updateUser,
} from "../utils/storage.js";
import { isoUint8Array } from "@simplewebauthn/server/helpers";

const router = express.Router();

const rpName = "FreshFlow";
const rpID = "localhost";
const expectedOrigin = "http://localhost:5173";

function logRequest(label, req) {
  console.log(`[WebAuthn] ${label}`, {
    body: req.body,
    origin: req.headers.origin,
    referer: req.headers.referer,
  });
}

router.post("/register/options", async (req, res) => {
  try {
    logRequest("POST /api/webauthn/register/options", req);

    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    let user = await findUserByEmail(email);

    if (!user) {
      user = await createUser(email, name);
      console.log("[WebAuthn] created user for registration", {
        id: user.id,
        email: user.email,
      });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: isoUint8Array.fromUTF8String(user.id),
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
    });

    user.currentChallenge = options.challenge;
    await updateUser(user);

    console.log("[WebAuthn] /register/options generated challenge", {
      email: user.email,
      challenge: options.challenge,
    });

    res.json(options);
  } catch (error) {
    console.error("[WebAuthn] /register/options error:", error);

    res.status(500).json({
      error: "Could not generate registration options",
      details: error.message,
    });
  }
});

router.post("/register/verify", async (req, res) => {
  try {
    logRequest("POST /api/webauthn/register/verify", req);

    const { email, response } = req.body;

    console.log("[WebAuthn] /register/verify request", {
      email,
      responseId: response?.id,
    });

    if (!email || !response) {
      return res.status(400).json({
        error: "Email and response are required",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (!user.currentChallenge) {
      return res.status(400).json({
        error: "No active registration challenge found for this user",
      });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;

    console.log("[WebAuthn] /register/verify result", {
      email: user.email,
      verified,
      hasRegistrationInfo: Boolean(registrationInfo),
    });

    if (!verified || !registrationInfo) {
      return res.status(400).json({
        verified: false,
        error: "Registration verification failed",
      });
    }

    const { credential } = registrationInfo;

    user.credentials.push({
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: response.response?.transports || [],
    });

    user.currentChallenge = null;

    await updateUser(user);

    console.log("[WebAuthn] credential saved", {
      email: user.email,
      credentialId: credential.id,
      credentialCount: user.credentials.length,
    });

    res.json({
      verified: true,
    });
  } catch (error) {
    console.error("[WebAuthn] /register/verify error:", error);

    res.status(500).json({
      verified: false,
      error: "Could not verify registration response",
      details: error.message,
    });
  }
});

router.post("/login/options", async (req, res) => {
  try {
    logRequest("POST /api/webauthn/login/options", req);

    const { email } = req.body;

    console.log("[WebAuthn] /login/options request", { email });

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const user = await findUserByEmail(email);

    if (!user || !user.credentials || user.credentials.length === 0) {
      return res.status(404).json({
        error: "No passkey registered for this email",
      });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.credentials.map((credential) => ({
        id: credential.id,
        transports: credential.transports || [],
      })),
      userVerification: "preferred",
    });

    user.currentChallenge = options.challenge;
    await updateUser(user);

    res.json(options);
  } catch (error) {
    console.error("Login options error:", error);

    res.status(500).json({
      error: "Could not generate login options",
      details: error.message,
    });
  }
});

router.post("/login/verify", async (req, res) => {
  try {
    logRequest("POST /api/webauthn/login/verify", req);

    const { email, response } = req.body;

    console.log("[WebAuthn] /login/verify request", {
      email,
      responseId: response?.id,
    });

    if (!email || !response) {
      return res.status(400).json({
        error: "Email and response are required",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (!user.currentChallenge) {
      return res.status(400).json({
        error: "No active login challenge found for this user",
      });
    }

    const storedCredential = user.credentials.find(
      (credential) => credential.id === response.id
    );

    if (!storedCredential) {
      return res.status(400).json({
        error: "Credential not found for this user",
      });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: storedCredential.id,
        publicKey: Buffer.from(storedCredential.publicKey, "base64url"),
        counter: storedCredential.counter,
        transports: storedCredential.transports || [],
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified) {
      return res.status(400).json({
        verified: false,
        error: "Login verification failed",
      });
    }

    storedCredential.counter = authenticationInfo.newCounter;
    user.currentChallenge = null;

    await updateUser(user);

    console.log("[WebAuthn] /login/verify success", {
      email: user.email,
      verified,
      newCounter: authenticationInfo.newCounter,
    });

    res.json({
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("[WebAuthn] /login/verify error:", error);

    res.status(500).json({
      verified: false,
      error: "Could not verify login response",
      details: error.message,
    });
  }
});

export default router;