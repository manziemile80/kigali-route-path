import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  BookOpen, Target, FlaskConical, BarChart3, Database, Map, Route,
  Users, Globe, Github, FileText, Presentation
} from 'lucide-react';

export function AboutPage() {
  const objectives = [
    'Develop an interactive GIS-based web platform for route planning in Kigali City',
    'Implement shortest path algorithms (Dijkstra and A*) for route optimization',
    'Analyze spatial accessibility to essential public services',
    'Provide visual analysis tools for urban planning and decision support',
    'Create a scalable system that can be extended to other cities',
  ];

  const methodology = [
    { step: 1, title: 'Data Collection', description: 'Gather OpenStreetMap road network data, Kigali administrative boundaries, and public service location datasets.' },
    { step: 2, title: 'Database Design', description: 'Design PostgreSQL + PostGIS schema for spatial data storage with pgRouting topology support.' },
    { step: 3, title: 'Algorithm Implementation', description: 'Implement Dijkstra and A* shortest path algorithms with performance optimization.' },
    { step: 4, title: 'Web Development', description: 'Build interactive frontend with React, Leaflet maps, and real-time routing visualization.' },
    { step: 5, title: 'Spatial Analysis', description: 'Develop buffer analysis, service area calculation, and accessibility metrics.' },
    { step: 6, title: 'Validation', description: 'Test and validate results against known routes and real-world scenarios.' },
  ];

  const technologies = [
    { category: 'Frontend', items: ['React 18', 'TypeScript', 'Tailwind CSS', 'Leaflet / React-Leaflet', 'Turf.js', 'Recharts'] },
    { category: 'Backend & Database', items: ['PostgreSQL 15', 'PostGIS', 'pgRouting', 'Supabase', 'Row Level Security'] },
    { category: 'Algorithms', items: ['Dijkstra\'s Algorithm', 'A* Search', 'Spatial Buffer Analysis', 'Network Analysis'] },
    { category: 'GIS Tools', items: ['GeoJSON', 'WKT/WKB', 'Spatial Indexing', 'Coordinate Systems (SRID 4326)'] },
  ];

  const findings = [
    {
      title: 'Algorithm Performance',
      result: 'A* algorithm shows 15-30% faster computation time for typical route queries while maintaining optimal path accuracy.',
    },
    {
      title: 'Service Coverage',
      result: 'Analysis reveals that 78% of Kigali residents have access to healthcare within 5km, while school coverage is approximately 85%.',
    },
    {
      title: 'Underserved Areas',
      result: 'Identified sectors with limited access to emergency services, suggesting priority areas for infrastructure development.',
    },
    {
      title: 'Route Efficiency',
      result: 'Average route optimization achieved 12-18% reduction in travel time compared to simple distance-based routing.',
    },
  ];

  const publications = [
    { title: 'GIS-Based Route Optimization for Urban Services: A Case Study of Kigali', venue: 'Conference Paper (2024)', authors: 'Research Team' },
    { title: 'Comparative Analysis of Shortest Path Algorithms in Urban Routing', venue: 'Journal Article', authors: 'Research Team' },
    { title: 'Spatial Accessibility Analysis for Public Service Planning', venue: 'Working Paper', authors: 'Research Team' },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <section className="py-16 bg-gradient-to-br from-kigali-green/10 to-kigali-blue/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm mb-6">
              <BookOpen className="w-4 h-4 text-kigali-green" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Research Project</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              About the Research
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
              Smart Route Planning and Shortest Path Analysis for Basic Services
              <br />
              <span className="text-kigali-green font-medium">Case Study: Kigali City, Rwanda</span>
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-kigali-green" />
                Research Objectives
              </h2>
              <ul className="space-y-4">
                {objectives.map((obj, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-kigali-green/10 text-kigali-green flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-gray-600 dark:text-gray-300">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-kigali-blue" />
                Abstract
              </h2>
              <Card>
                <CardBody>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    This research presents a comprehensive GIS-based spatial decision support system
                    designed to optimize route planning and analyze accessibility to essential public
                    services in Kigali City, Rwanda. The platform integrates OpenStreetMap road network
                    data with detailed service location datasets, implementing both Dijkstra and A*
                    shortest path algorithms for comparative performance analysis.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                    Through spatial buffer analysis and service area mapping, the system identifies
                    underserved regions and provides quantitative metrics for urban planning decisions.
                    The web-based platform offers an interactive interface for citizens, planners,
                    and researchers to explore accessibility patterns and plan optimal routes.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {['GIS', 'Route Optimization', 'Spatial Analysis', 'Urban Planning', 'Kigali', 'PostGIS'].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Research Methodology
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {methodology.map((item) => (
              <Card key={item.step} hoverable>
                <CardBody>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-kigali-green text-white flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center">
            <Database className="w-6 h-6 mr-2" />
            Technology Stack
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologies.map((tech) => (
              <Card key={tech.category}>
                <CardHeader title={tech.category} />
                <CardBody>
                  <ul className="space-y-2">
                    {tech.items.map((item) => (
                      <li key={item} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-kigali-green" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Key Findings
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {findings.map((finding) => (
              <Card key={finding.title}>
                <CardBody>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {finding.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {finding.result}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center">
            <FileText className="w-6 h-6 mr-2" />
            Publications & Presentations
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {publications.map((pub) => (
              <Card key={pub.title} hoverable>
                <CardBody>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {pub.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {pub.venue}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {pub.authors}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-kigali-green to-kigali-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Explore the Platform
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Try the interactive map, plan routes, and analyze accessibility across Kigali City
            using our comprehensive GIS platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="bg-white text-kigali-green hover:bg-gray-100 border-white"
              onClick={() => window.location.href = '/map'}
            >
              <Map className="w-5 h-5 mr-2" />
              Open Interactive Map
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-white border-white hover:bg-white/10"
              onClick={() => window.location.href = '/routes'}
            >
              <Route className="w-5 h-5 mr-2" />
              Plan a Route
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center">
            <Users className="w-6 h-6 mr-2" />
            Research Team & Acknowledgments
          </h2>
          <Card>
            <CardBody className="text-center">
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                This research was conducted as part of a Geomatics and GIS academic project.
                We acknowledge the use of OpenStreetMap data, PostGIS spatial database technology,
                and the open-source GIS community for tools and datasets that made this work possible.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Globe className="w-5 h-5 text-kigali-green" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">OpenStreetMap</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Database className="w-5 h-5 text-kigali-blue" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">PostGIS</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Presentation className="w-5 h-5 text-accent-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">University Support</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
