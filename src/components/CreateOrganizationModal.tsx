"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationCreated: () => void;
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onOrganizationCreated,
}: CreateOrganizationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    country: "",
    icaoCode: "",
    contact: {
      email: "",
      phone: "",
      address: "",
    },
    settings: {
      publicUrl: "",
      timezone: "UTC",
      language: "en",
    },
    subscription: {
      plan: "basic",
      maxUsers: 5,
      maxDocuments: 10,
    },
    features: {
      document_management: true,
      checklists: true,
      file_upload: true,
      word_conversion: true,
      pdf_viewer: true,
      pdf_annotations: true,
      git_versioning: true,
      review_workflow: true,
      approval_workflow: true,
      realtime_collaboration: true,
      export_pdf: true,
      export_docx: true,
    },
    modules: {
      eaip: true,
      notam: true,
      airac: true,
      compliance: true,
      workflow: true,
      checklists: true,
      publicViewer: true,
    },
  });

  const countries: { [code: string]: string } = {
    AF: "Afghanistan",
    AL: "Albania",
    DZ: "Algeria",
    AS: "American Samoa",
    AD: "Andorra",
    AO: "Angola",
    AI: "Anguilla",
    AQ: "Antarctica",
    AG: "Antigua and Barbuda",
    AR: "Argentina",
    AM: "Armenia",
    AW: "Aruba",
    AU: "Australia",
    AT: "Austria",
    AZ: "Azerbaijan",
    BS: "Bahamas",
    BH: "Bahrain",
    BD: "Bangladesh",
    BB: "Barbados",
    BY: "Belarus",
    BE: "Belgium",
    BZ: "Belize",
    BJ: "Benin",
    BM: "Bermuda",
    BT: "Bhutan",
    BO: "Bolivia",
    BQ: "Bonaire, Sint Eustatius and Saba",
    BA: "Bosnia and Herzegovina",
    BW: "Botswana",
    BV: "Bouvet Island",
    BR: "Brazil",
    IO: "British Indian Ocean Territory",
    BN: "Brunei Darussalam",
    BG: "Bulgaria",
    BF: "Burkina Faso",
    BI: "Burundi",
    CV: "Cabo Verde",
    KH: "Cambodia",
    CM: "Cameroon",
    CA: "Canada",
    KY: "Cayman Islands",
    CF: "Central African Republic",
    TD: "Chad",
    CL: "Chile",
    CN: "China",
    CX: "Christmas Island",
    CC: "Cocos (Keeling) Islands",
    CO: "Colombia",
    KM: "Comoros",
    CG: "Congo",
    CD: "Congo (Democratic Republic of the)",
    CK: "Cook Islands",
    CR: "Costa Rica",
    CI: "Côte d'Ivoire",
    HR: "Croatia",
    CU: "Cuba",
    CW: "Curaçao",
    CY: "Cyprus",
    CZ: "Czech Republic",
    DK: "Denmark",
    DJ: "Djibouti",
    DM: "Dominica",
    DO: "Dominican Republic",
    EC: "Ecuador",
    EG: "Egypt",
    SV: "El Salvador",
    GQ: "Equatorial Guinea",
    ER: "Eritrea",
    EE: "Estonia",
    SZ: "Eswatini",
    ET: "Ethiopia",
    FK: "Falkland Islands (Malvinas)",
    FO: "Faroe Islands",
    FJ: "Fiji",
    FI: "Finland",
    FR: "France",
    GF: "French Guiana",
    PF: "French Polynesia",
    TF: "French Southern Territories",
    GA: "Gabon",
    GM: "Gambia",
    GE: "Georgia",
    DE: "Germany",
    GH: "Ghana",
    GI: "Gibraltar",
    GR: "Greece",
    GL: "Greenland",
    GD: "Grenada",
    GP: "Guadeloupe",
    GU: "Guam",
    GT: "Guatemala",
    GG: "Guernsey",
    GN: "Guinea",
    GW: "Guinea-Bissau",
    GY: "Guyana",
    HT: "Haiti",
    HM: "Heard Island and McDonald Islands",
    VA: "Holy See",
    HN: "Honduras",
    HK: "Hong Kong",
    HU: "Hungary",
    IS: "Iceland",
    IN: "India",
    ID: "Indonesia",
    IR: "Iran",
    IQ: "Iraq",
    IE: "Ireland",
    IM: "Isle of Man",
    IL: "Israel",
    IT: "Italy",
    JM: "Jamaica",
    JP: "Japan",
    JE: "Jersey",
    JO: "Jordan",
    KZ: "Kazakhstan",
    KE: "Kenya",
    KI: "Kiribati",
    KP: "Korea (Democratic People's Republic of)",
    KR: "Korea (Republic of)",
    KW: "Kuwait",
    KG: "Kyrgyzstan",
    LA: "Lao People's Democratic Republic",
    LV: "Latvia",
    LB: "Lebanon",
    LS: "Lesotho",
    LR: "Liberia",
    LY: "Libya",
    LI: "Liechtenstein",
    LT: "Lithuania",
    LU: "Luxembourg",
    MO: "Macao",
    MG: "Madagascar",
    MW: "Malawi",
    MY: "Malaysia",
    MV: "Maldives",
    ML: "Mali",
    MT: "Malta",
    MH: "Marshall Islands",
    MQ: "Martinique",
    MR: "Mauritania",
    MU: "Mauritius",
    YT: "Mayotte",
    MX: "Mexico",
    FM: "Micronesia",
    MD: "Moldova",
    MC: "Monaco",
    MN: "Mongolia",
    ME: "Montenegro",
    MS: "Montserrat",
    MA: "Morocco",
    MZ: "Mozambique",
    MM: "Myanmar",
    NA: "Namibia",
    NR: "Nauru",
    NP: "Nepal",
    NL: "Netherlands",
    NC: "New Caledonia",
    NZ: "New Zealand",
    NI: "Nicaragua",
    NE: "Niger",
    NG: "Nigeria",
    NU: "Niue",
    NF: "Norfolk Island",
    MK: "North Macedonia",
    MP: "Northern Mariana Islands",
    NO: "Norway",
    OM: "Oman",
    PK: "Pakistan",
    PW: "Palau",
    PS: "Palestine",
    PA: "Panama",
    PG: "Papua New Guinea",
    PY: "Paraguay",
    PE: "Peru",
    PH: "Philippines",
    PN: "Pitcairn",
    PL: "Poland",
    PT: "Portugal",
    PR: "Puerto Rico",
    QA: "Qatar",
    RE: "Réunion",
    RO: "Romania",
    RU: "Russian Federation",
    RW: "Rwanda",
    BL: "Saint Barthélemy",
    SH: "Saint Helena, Ascension and Tristan da Cunha",
    KN: "Saint Kitts and Nevis",
    LC: "Saint Lucia",
    MF: "Saint Martin (French part)",
    PM: "Saint Pierre and Miquelon",
    VC: "Saint Vincent and the Grenadines",
    WS: "Samoa",
    SM: "San Marino",
    ST: "Sao Tome and Principe",
    SA: "Saudi Arabia",
    SN: "Senegal",
    RS: "Serbia",
    SC: "Seychelles",
    SL: "Sierra Leone",
    SG: "Singapore",
    SX: "Sint Maarten (Dutch part)",
    SK: "Slovakia",
    SI: "Slovenia",
    SB: "Solomon Islands",
    SO: "Somalia",
    ZA: "South Africa",
    GS: "South Georgia and the South Sandwich Islands",
    SS: "South Sudan",
    ES: "Spain",
    LK: "Sri Lanka",
    SD: "Sudan",
    SR: "Suriname",
    SJ: "Svalbard and Jan Mayen",
    SE: "Sweden",
    CH: "Switzerland",
    SY: "Syrian Arab Republic",
    TW: "Taiwan",
    TJ: "Tajikistan",
    TZ: "Tanzania",
    TH: "Thailand",
    TL: "Timor-Leste",
    TG: "Togo",
    TK: "Tokelau",
    TO: "Tonga",
    TT: "Trinidad and Tobago",
    TN: "Tunisia",
    TR: "Turkey",
    TM: "Turkmenistan",
    TC: "Turks and Caicos Islands",
    TV: "Tuvalu",
    UG: "Uganda",
    UA: "Ukraine",
    AE: "United Arab Emirates",
    GB: "United Kingdom",
    US: "United States of America",
    UM: "United States Minor Outlying Islands",
    UY: "Uruguay",
    UZ: "Uzbekistan",
    VU: "Vanuatu",
    VE: "Venezuela",
    VN: "Viet Nam",
    VG: "Virgin Islands (British)",
    VI: "Virgin Islands (U.S.)",
    WF: "Wallis and Futuna",
    EH: "Western Sahara",
    YE: "Yemen",
    ZM: "Zambia",
    ZW: "Zimbabwe",
  };

  const subscriptionPlans = [
    { value: "basic", label: "Basic", maxUsers: 5, maxDocuments: 10 },
    {
      value: "professional",
      label: "Professional",
      maxUsers: 25,
      maxDocuments: 50,
    },
    {
      value: "enterprise",
      label: "Enterprise",
      maxUsers: 100,
      maxDocuments: 200,
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePlanChange = (plan: string) => {
    const selectedPlan = subscriptionPlans.find((p) => p.value === plan);
    if (selectedPlan) {
      setFormData((prev) => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          plan,
          maxUsers: selectedPlan.maxUsers,
          maxDocuments: selectedPlan.maxDocuments,
        },
      }));
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature as keyof typeof prev.features],
      },
    }));
  };

  const handleModuleToggle = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: !prev.modules[module as keyof typeof prev.modules],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onOrganizationCreated();
        onClose();
        setFormData({
          name: "",
          domain: "",
          country: "",
          icaoCode: "",
          contact: {
            email: "",
            phone: "",
            address: "",
          },
          settings: {
            publicUrl: "",
            timezone: "UTC",
            language: "en",
          },
          subscription: {
            plan: "basic",
            maxUsers: 5,
            maxDocuments: 10,
          },
          features: {
            document_management: true,
            checklists: true,
            file_upload: true,
            word_conversion: true,
            pdf_viewer: true,
            pdf_annotations: true,
            git_versioning: true,
            review_workflow: true,
            approval_workflow: true,
            realtime_collaboration: true,
            export_pdf: true,
            export_docx: true,
          },
          modules: {
            eaip: true,
            notam: true,
            airac: true,
            compliance: true,
            workflow: true,
            checklists: true,
            publicViewer: true,
          },
        });
      } else {
        alert(result.error || "Failed to create organization");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      alert("Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Create New Organization
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Austria Control"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain *
              </label>
              <input
                type="text"
                required
                value={formData.domain}
                onChange={(e) =>
                  handleInputChange("domain", e.target.value.toLowerCase())
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. austro-control"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                  {formData.country || "Select Country"}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                  {Object.entries(countries).map(([code, name]) => (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => handleInputChange("country", code)}
                    >
                      {name} : {code}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ICAO Code
              </label>
              <input
                type="text"
                value={formData.icaoCode}
                onChange={(e) =>
                  handleInputChange("icaoCode", e.target.value.toUpperCase())
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. LOWW"
                maxLength={4}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contact.email}
                  onChange={(e) =>
                    handleInputChange("contact.email", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@organization.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contact.phone}
                  onChange={(e) =>
                    handleInputChange("contact.phone", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+43 1 17030 0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Textarea
                required
                value={formData.contact.address}
                onChange={(e) =>
                  handleInputChange("contact.address", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full address including city and postal code"
                rows={3}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Organization Settings
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public URL *
              </label>
              <input
                type="url"
                required
                value={formData.settings.publicUrl}
                onChange={(e) =>
                  handleInputChange("settings.publicUrl", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://eaip.organization.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                    {formData.settings.timezone}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        handleInputChange("settings.timezone", "UTC")
                      }
                    >
                      UTC
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleInputChange("settings.timezone", "Europe/Vienna")
                      }
                    >
                      Europe/Vienna
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleInputChange("settings.timezone", "Europe/London")
                      }
                    >
                      Europe/London
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleInputChange(
                          "settings.timezone",
                          "America/New_York"
                        )
                      }
                    >
                      America/New_York
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                    {formData.settings.language === "en"
                      ? "English"
                      : formData.settings.language}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        handleInputChange("settings.language", "en")
                      }
                    >
                      English
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleInputChange("settings.language", "de")
                      }
                    >
                      German
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleInputChange("settings.language", "fr")
                      }
                    >
                      French
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Subscription Plan
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                  {subscriptionPlans.find(
                    (p) => p.value === formData.subscription.plan
                  )?.label || "Select Plan"}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {subscriptionPlans.map((plan) => (
                    <DropdownMenuItem
                      key={plan.value}
                      onClick={() => handlePlanChange(plan.value)}
                    >
                      <div>
                        <div className="font-medium">{plan.label}</div>
                        <div className="text-xs text-gray-500">
                          {plan.maxUsers} users, {plan.maxDocuments} documents
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Users
                </label>
                <input
                  type="number"
                  value={formData.subscription.maxUsers}
                  onChange={(e) =>
                    handleInputChange("subscription.maxUsers", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Documents
                </label>
                <input
                  type="number"
                  value={formData.subscription.maxDocuments}
                  onChange={(e) =>
                    handleInputChange(
                      "subscription.maxDocuments",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Features
            </h3>
            <p className="text-sm text-gray-600">
              Select which features will be available for this organization
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-document_management"
                  checked={formData.features.document_management}
                  onCheckedChange={() => handleFeatureToggle('document_management')}
                />
                <label
                  htmlFor="feature-document_management"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Document Management
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-checklists"
                  checked={formData.features.checklists}
                  onCheckedChange={() => handleFeatureToggle('checklists')}
                />
                <label
                  htmlFor="feature-checklists"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Checklists
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-file_upload"
                  checked={formData.features.file_upload}
                  onCheckedChange={() => handleFeatureToggle('file_upload')}
                />
                <label
                  htmlFor="feature-file_upload"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  File Upload
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-word_conversion"
                  checked={formData.features.word_conversion}
                  onCheckedChange={() => handleFeatureToggle('word_conversion')}
                />
                <label
                  htmlFor="feature-word_conversion"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Word Conversion
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-pdf_viewer"
                  checked={formData.features.pdf_viewer}
                  onCheckedChange={() => handleFeatureToggle('pdf_viewer')}
                />
                <label
                  htmlFor="feature-pdf_viewer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  PDF Viewer
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-pdf_annotations"
                  checked={formData.features.pdf_annotations}
                  onCheckedChange={() => handleFeatureToggle('pdf_annotations')}
                />
                <label
                  htmlFor="feature-pdf_annotations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  PDF Annotations
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-git_versioning"
                  checked={formData.features.git_versioning}
                  onCheckedChange={() => handleFeatureToggle('git_versioning')}
                />
                <label
                  htmlFor="feature-git_versioning"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Git Versioning
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-review_workflow"
                  checked={formData.features.review_workflow}
                  onCheckedChange={() => handleFeatureToggle('review_workflow')}
                />
                <label
                  htmlFor="feature-review_workflow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Review Workflow
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-approval_workflow"
                  checked={formData.features.approval_workflow}
                  onCheckedChange={() => handleFeatureToggle('approval_workflow')}
                />
                <label
                  htmlFor="feature-approval_workflow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Approval Workflow
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-realtime_collaboration"
                  checked={formData.features.realtime_collaboration}
                  onCheckedChange={() => handleFeatureToggle('realtime_collaboration')}
                />
                <label
                  htmlFor="feature-realtime_collaboration"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Realtime Collaboration
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-export_pdf"
                  checked={formData.features.export_pdf}
                  onCheckedChange={() => handleFeatureToggle('export_pdf')}
                />
                <label
                  htmlFor="feature-export_pdf"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Export PDF
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-export_docx"
                  checked={formData.features.export_docx}
                  onCheckedChange={() => handleFeatureToggle('export_docx')}
                />
                <label
                  htmlFor="feature-export_docx"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Export DOCX
                </label>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Modules
            </h3>
            <p className="text-sm text-gray-600">
              Select which modules will be available for this organization
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-eaip"
                  checked={formData.modules.eaip}
                  onCheckedChange={() => handleModuleToggle('eaip')}
                />
                <label
                  htmlFor="module-eaip"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  eAIP
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-notam"
                  checked={formData.modules.notam}
                  onCheckedChange={() => handleModuleToggle('notam')}
                />
                <label
                  htmlFor="module-notam"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  NOTAM
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-airac"
                  checked={formData.modules.airac}
                  onCheckedChange={() => handleModuleToggle('airac')}
                />
                <label
                  htmlFor="module-airac"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  AIRAC
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-compliance"
                  checked={formData.modules.compliance}
                  onCheckedChange={() => handleModuleToggle('compliance')}
                />
                <label
                  htmlFor="module-compliance"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Compliance
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-workflow"
                  checked={formData.modules.workflow}
                  onCheckedChange={() => handleModuleToggle('workflow')}
                />
                <label
                  htmlFor="module-workflow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Workflow
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-checklists"
                  checked={formData.modules.checklists}
                  onCheckedChange={() => handleModuleToggle('checklists')}
                />
                <label
                  htmlFor="module-checklists"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Checklists
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-publicViewer"
                  checked={formData.modules.publicViewer}
                  onCheckedChange={() => handleModuleToggle('publicViewer')}
                />
                <label
                  htmlFor="module-publicViewer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Public Viewer
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
