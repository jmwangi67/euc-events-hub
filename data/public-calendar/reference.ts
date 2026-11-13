import { registeredHosts } from "../fixtures/hosts";
import {
  majorSchema,
  organizationSchema,
  type OrganizationCluster,
} from "../../lib/domain/models";

export const publicMajors = majorSchema.array().parse([
  { id: "bme", name: "Biomedical Engineering", abbreviation: "BME" },
  { id: "ce", name: "Civil Engineering", abbreviation: "CE" },
  { id: "che", name: "Chemical Engineering", abbreviation: "CHE" },
  { id: "me", name: "Mechanical Engineering", abbreviation: "ME" },
]);
export const publicOrganizations = organizationSchema.array().parse([
  ...registeredHosts,
  {
    id: "psu-euc",
    name: "Engineering Undergraduate Council",
    shortName: "EUC",
    hostType: "student-organization",
    defaultMajorIds: [],
  },
  {
    id: "psu-asce",
    name: "American Society of Civil Engineers · Penn State",
    shortName: "ASCE",
    source: {
      label:
        "Penn State Civil and Environmental Engineering organization directory",
      url: "https://www.cee.psu.edu/academics/resources/student-organizations.aspx",
      verification: "verified",
    },
    hostType: "student-organization",
    defaultMajorIds: ["ce"],
  },
  {
    id: "psu-oxe",
    name: "Omega Chi Epsilon · Penn State",
    shortName: "OXE",
    source: {
      label: "Penn State Chemical Engineering organization directory",
      url: "https://www.che.psu.edu/academics/resources/student-groups.aspx",
      verification: "verified",
    },
    hostType: "student-organization",
    defaultMajorIds: ["che"],
  },
  {
    id: "psu-career-services",
    name: "Penn State Career Services",
    shortName: "Career Services",
    hostType: "university-unit",
    institutionId: "psu",
    unitType: "administrative-unit",
    defaultMajorIds: [],
  },
]);
export const publicClusters: OrganizationCluster[] = [];
