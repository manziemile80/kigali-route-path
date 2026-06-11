import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { fetchServiceLocations, createServiceLocation, updateServiceLocation, deleteServiceLocation } from '../utils/api';
import type { ServiceLocation, ServiceCategory, Coordinates } from '../types';
import { CATEGORY_LABELS } from '../types';
import {
  Settings, Plus, Edit, Trash2, MapPin, Phone, Mail, Clock, Users,
  CheckCircle, AlertCircle, Save, X, Search, Filter, ChevronDown, ChevronUp
} from 'lucide-react';

interface ServiceFormData {
  name: string;
  category: ServiceCategory;
  subcategory: string;
  address: string;
  lat: string;
  lng: string;
  contact_phone: string;
  contact_email: string;
  operating_hours: string;
  capacity: number;
  wheelchair_accessible: boolean;
  emergency_services: boolean;
  verified: boolean;
}

const defaultFormData: ServiceFormData = {
  name: '',
  category: 'hospital',
  subcategory: '',
  address: '',
  lat: '-1.96',
  lng: '30.07',
  contact_phone: '',
  contact_email: '',
  operating_hours: '',
  capacity: 0,
  wheelchair_accessible: false,
  emergency_services: false,
  verified: false,
};

export function AdminDashboard() {
  const [services, setServices] = useState<ServiceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await fetchServiceLocations();
      setServices(data);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const serviceData = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        address: formData.address || undefined,
        coordinates: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        contact_phone: formData.contact_phone || undefined,
        contact_email: formData.contact_email || undefined,
        operating_hours: formData.operating_hours || undefined,
        capacity: formData.capacity || undefined,
        wheelchair_accessible: formData.wheelchair_accessible,
        emergency_services: formData.emergency_services,
        verified: formData.verified,
        rating: 0,
      };

      if (editingId) {
        await updateServiceLocation(editingId, serviceData);
      } else {
        await createServiceLocation(serviceData);
      }

      await loadServices();
      resetForm();
    } catch (err) {
      console.error('Error saving service:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: ServiceLocation) => {
    setEditingId(service.id);
    setIsEditing(true);
    setShowForm(true);
    setFormData({
      name: service.name,
      category: service.category,
      subcategory: service.subcategory || '',
      address: service.address || '',
      lat: service.coordinates.lat.toString(),
      lng: service.coordinates.lng.toString(),
      contact_phone: service.contact_phone || '',
      contact_email: service.contact_email || '',
      operating_hours: service.operating_hours || '',
      capacity: service.capacity || 0,
      wheelchair_accessible: service.wheelchair_accessible,
      emergency_services: service.emergency_services,
      verified: service.verified,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service location?')) return;

    try {
      await deleteServiceLocation(id);
      await loadServices();
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsEditing(false);
    setShowForm(false);
  };

  const filteredServices = services
    .filter((s) => {
      const matchesSearch = searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === '' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const stats = {
    total: services.length,
    verified: services.filter((s) => s.verified).length,
    emergency: services.filter((s) => s.emergency_services).length,
    accessible: services.filter((s) => s.wheelchair_accessible).length,
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="w-8 h-8 mr-3 text-kigali-green" />
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage service locations and GIS data for Kigali City
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardBody className="text-center">
              <MapPin className="w-6 h-6 text-kigali-green mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Services</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.verified}</p>
              <p className="text-sm text-gray-500">Verified</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.emergency}</p>
              <p className="text-sm text-gray-500">Emergency Services</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accessible}</p>
              <p className="text-sm text-gray-500">Wheelchair Accessible</p>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader title="Filters" />
          <CardBody>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or address..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kigali-green"
                  />
                </div>
              </div>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | '')}
                options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
                className="w-full md:w-48"
              />
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="name">Sort by Name</option>
                  <option value="category">Sort by Category</option>
                  <option value="created_at">Sort by Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  {sortOrder === 'asc' ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {showForm && (
          <Card className="mb-6 border-kigali-green">
            <CardHeader
              title={isEditing ? 'Edit Service Location' : 'Add New Service Location'}
              subtitle="Enter the details for the service location"
            />
            <form onSubmit={handleSubmit}>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Service Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Select
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
                    options={categoryOptions}
                  />
                </div>
                <Input
                  label="Subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  helperText="Optional: e.g., 'primary', 'tertiary', 'branch'"
                />
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    required
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                  <Input
                    label="Contact Email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Operating Hours"
                    value={formData.operating_hours}
                    onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                    leftIcon={<Clock className="w-4 h-4" />}
                    placeholder="e.g., 08:00-17:00"
                  />
                  <Input
                    label="Capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    leftIcon={<Users className="w-4 h-4" />}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.wheelchair_accessible}
                      onChange={(e) => setFormData({ ...formData, wheelchair_accessible: e.target.checked })}
                      className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Wheelchair Accessible</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emergency_services}
                      onChange={(e) => setFormData({ ...formData, emergency_services: e.target.checked })}
                      className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Emergency Services</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.verified}
                      onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                      className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Verified</span>
                  </label>
                </div>
              </CardBody>
              <CardFooter className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update Service' : 'Add Service'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Service Locations"
            subtitle={`${filteredServices.length} of ${services.length} services`}
          />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {service.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {service.contact_phone || 'No phone'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" style={{
                          backgroundColor: `opacity-20`,
                        }}>
                          {CATEGORY_LABELS[service.category]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {service.address || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          {service.verified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Verified
                            </span>
                          )}
                          {service.emergency_services && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Emergency
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-1 text-gray-400 hover:text-kigali-green"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
