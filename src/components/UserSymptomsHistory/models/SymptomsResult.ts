import { GenderKeys } from "../services/config/SymptomsConfig";

export interface SymptomsResult {
  symptoms: Array<string>;
  gender: GenderKeys;
}
