export const DEFAULT_TEMPLATES = [
  {
    name: 'GEN 1.1 - Designated Authorities',
    description: 'Template for General Section 1.1 - Designated Authorities',
    section: 'GEN',
    subsection: '1.1',
    content: `<h1>GEN 1.1 DESIGNATED AUTHORITIES</h1>
<h2>1. Civil Aviation Authority</h2>
<p><strong>Name:</strong> [Authority Name]</p>
<p><strong>Address:</strong> [Full Address]</p>
<p><strong>Telephone:</strong> [Phone Number]</p>
<p><strong>Email:</strong> [Email Address]</p>
<p><strong>Website:</strong> [Website URL]</p>

<h2>2. Responsibilities</h2>
<ul>
<li>Regulation of civil aviation</li>
<li>Licensing and certification</li>
<li>Safety oversight</li>
<li>Aeronautical information services</li>
</ul>`,
    isDefault: true,
  },
  {
    name: 'GEN 2.1 - Measuring System',
    description: 'Template for General Section 2.1 - Measuring System',
    section: 'GEN',
    subsection: '2.1',
    content: `<h1>GEN 2.1 MEASURING SYSTEM, AIRCRAFT MARKINGS, HOLIDAYS</h1>
<h2>1. Units of Measurement</h2>
<p>The following units of measurement are used in [State]:</p>
<table>
<tr><th>Measurement</th><th>Unit</th><th>Abbreviation</th></tr>
<tr><td>Distance</td><td>Nautical Mile</td><td>NM</td></tr>
<tr><td>Altitude/Height</td><td>Feet</td><td>FT</td></tr>
<tr><td>Speed</td><td>Knots</td><td>KT</td></tr>
<tr><td>Temperature</td><td>Celsius</td><td>°C</td></tr>
</table>

<h2>2. Coordinate System</h2>
<p>Geographical coordinates are based on the World Geodetic System - 1984 (WGS-84).</p>`,
    isDefault: true,
  },
  {
    name: 'ENR 1.1 - General Rules',
    description: 'Template for En-route Section 1.1 - General Rules',
    section: 'ENR',
    subsection: '1.1',
    content: `<h1>ENR 1.1 GENERAL RULES</h1>
<h2>1. Rule of the Air</h2>
<p>[State] has adopted the Standards and Recommended Practices contained in ICAO Annex 2 - Rules of the Air.</p>

<h2>2. Visual Flight Rules (VFR)</h2>
<h3>2.1 VFR Flight Conditions</h3>
<p>VFR flights shall be conducted when visibility and distance from clouds are equal to or greater than those specified in the table below:</p>

<h2>3. Instrument Flight Rules (IFR)</h2>
<p>All IFR flights shall be conducted in accordance with IFR procedures published in this AIP.</p>`,
    isDefault: true,
  },
  {
    name: 'AD 2 - Aerodrome',
    description: 'Template for Aerodrome Section 2 - Aerodrome',
    section: 'AD',
    subsection: '2',
    content: `<h1>AD 2.[ICAO CODE] - [AERODROME NAME]</h1>

<h2>AD 2.1 Aerodrome Location Indicator and Name</h2>
<p><strong>ICAO Location Indicator:</strong> [ICAO Code]</p>
<p><strong>Aerodrome Name:</strong> [Full Name]</p>

<h2>AD 2.2 Aerodrome Geographic and Administrative Data</h2>
<p><strong>ARP Coordinates:</strong> [Latitude] [Longitude]</p>
<p><strong>Elevation:</strong> [Elevation] FT</p>
<p><strong>Reference Temperature:</strong> [Temperature] °C</p>

<h2>AD 2.3 Operational Hours</h2>
<p><strong>Airport:</strong> H24</p>
<p><strong>ATS:</strong> H24</p>

<h2>AD 2.12 Runway Physical Characteristics</h2>
<table>
<tr><th>Designator</th><th>Dimensions</th><th>Surface</th><th>Strength</th></tr>
<tr><td>[RWY]</td><td>[Length]m x [Width]m</td><td>[Surface Type]</td><td>[PCN]</td></tr>
</table>`,
    isDefault: true,
  },
];

export async function seedDefaultTemplates(mongoose: any) {
  try {
    const DocumentTemplate = mongoose.models.DocumentTemplate ||
      mongoose.model('DocumentTemplate', new mongoose.Schema({
        name: String,
        description: String,
        section: String,
        subsection: String,
        content: String,
        isDefault: Boolean,
        organizationId: mongoose.Schema.Types.ObjectId,
        createdBy: Object,
      }, { timestamps: true }));

    // Check if default templates already exist
    const existingCount = await DocumentTemplate.countDocuments({ isDefault: true });

    if (existingCount === 0) {
      await DocumentTemplate.insertMany(DEFAULT_TEMPLATES);
      console.log('Default templates seeded successfully');
    } else {
      console.log('Default templates already exist');
    }
  } catch (error) {
    console.error('Error seeding templates:', error);
  }
}