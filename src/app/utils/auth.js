import jwt from 'jsonwebtoken';

const JWT_SECRET = "43027bae66101fbad9c1ef4eb02e8158f5e2afa34b60f11144da6ea80dbdce68";

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
