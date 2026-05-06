import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { ImagePreview } from '../../components/ui/ImagePreview';
import {
  createCategory,
  createProduct,
  getCategories,
  getProducts,
  uploadProductImages,
} from '../../services/productService';
import type {
  CreateProductPayload,
  ProductAnalyticsProduct,
  ProductCategory,
} from '../../types/product';

interface ProductFormState {
  name: string;
  categoryId: string;
  brand: string;
  description: string;
  price: string;
  discountPrice: string;
  images: string[];
  primaryPlacement: string;
  collection: string;
  promoCode: string;
  campaign: string;
  status: 'active' | 'hidden';
  performance: 'new arrival' | 'recommended' | 'featured';
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

const initialFormState: ProductFormState = {
  name: '',
  categoryId: '',
  brand: '',
  description: '',
  price: '',
  discountPrice: '',
  images: [],
  primaryPlacement: 'Homepage',
  collection: '',
  promoCode: '',
  campaign: '',
  status: 'active',
  performance: 'new arrival',
  slug: '',
  metaTitle: '',
  metaDescription: '',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function AdminAnalyticsPage() {
  const [products, setProducts] = useState<ProductAnalyticsProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>(
    'all',
  );
  const [formState, setFormState] = useState(() => ({ ...initialFormState }));
  const [categoryName, setCategoryName] = useState('');
  // Each entry keeps the raw File (for upload) and a stable objectURL (for preview)
  const [pendingImages, setPendingImages] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);
  const previewUrls = useMemo(
    () => pendingImages.map((item) => item.previewUrl),
    [pendingImages],
  );

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [categoryData, productData] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);

        if (!active) {
          return;
        }

        setCategories(categoryData);
        setProducts(productData);
        setFormState((current) => ({
          ...current,
          categoryId: current.categoryId || categoryData[0]?.id || '',
        }));
      } catch (error) {
        console.error(error);
        toast.error('Unable to load admin analytics data.');
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || product.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  const totalRevenue = products.reduce(
    (sum, product) => sum + (product.discountPrice ?? product.price),
    0,
  );
  const featuredProduct = products.find(
    (product) => product.performance === 'featured',
  );
  const trendingProduct = products.find(
    (product) => product.performance === 'recommended',
  );

  const resetForm = () => {
    setFormState({
      ...initialFormState,
      categoryId: categories[0]?.id ?? '',
    });
    // Revoke all object URLs to free memory
    setPendingImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  };

  const handleProductChange = (
    key: keyof ProductFormState,
    value: string | string[],
  ) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.categoryId) {
      toast.error('Please select a category before publishing the product.');
      return;
    }

    // Upload staged files now, at submit time
    let imageUrls: string[] = [];
    if (pendingImages.length > 0) {
      try {
        const result = await uploadProductImages(pendingImages.map((i) => i.file));
        imageUrls = result.urls;
      } catch (error) {
        console.error(error);
        toast.error('Failed to upload images. Please try again.');
        return;
      }
    }

    const payload: CreateProductPayload = {
      name: formState.name.trim() || 'Untitled product',
      categoryId: formState.categoryId,
      brand: formState.brand.trim() || undefined,
      description: formState.description.trim() || undefined,
      price: Number(formState.price) || 0,
      discountPrice:
        formState.discountPrice.trim().length > 0
          ? Number(formState.discountPrice)
          : undefined,
      images: imageUrls, // uploaded URLs (empty array if none staged)
      primaryPlacement: formState.primaryPlacement || undefined,
      collection: formState.collection.trim() || undefined,
      promoCode: formState.promoCode.trim() || undefined,
      campaign: formState.campaign.trim() || undefined,
      status: formState.status,
      performance: formState.performance,
      slug: formState.slug.trim() || createSlug(formState.name),
      metaTitle: formState.metaTitle.trim() || undefined,
      metaDescription: formState.metaDescription.trim() || undefined,
    };

    try {
      const createdProduct = await createProduct(payload);
      setProducts((current) => [createdProduct, ...current]);
      toast.success('Product created successfully.');
      resetForm();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to create product. Please try again.',
      );
    }
  };

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      toast.error('Category name cannot be empty.');
      return;
    }

    try {
      const addedCategory = await createCategory({ name: trimmedName });
      setCategories((current) => [...current, addedCategory]);
      setCategoryName('');
      setIsCategoryModalOpen(false);
      setFormState((current) => ({
        ...current,
        categoryId: current.categoryId || addedCategory.id,
      }));
      toast.success('Category added successfully.');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to add category. Please try again.',
      );
    }
  };

  return (
    <AdminLayout>
      <div className='min-h-full p-6 md:px-10'>
        <div className='mx-auto max-w-7xl'>
          <header className='mb-8'>
            <p className='text-sm uppercase tracking-[0.35em] text-[#6D5A46] font-semibold'>
              Product analytics
            </p>
            <div className='mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
              <div>
                <h1 className='text-4xl font-bold text-black'>
                  Track product performance and sales insights
                </h1>
                <p className='mt-3 max-w-2xl text-[#6D5A46]'>
                  Review products from the catalog, add new inventory, and
                  manage categories from one place.
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                <button
                  type='button'
                  onClick={() => setIsCategoryModalOpen(true)}
                  className='rounded-full border border-[#6D5A46] bg-white px-5 py-3 text-sm font-semibold text-[#6D5A46] transition hover:border-dark-red hover:text-dark-red'
                >
                  Add category
                </button>
                <button
                  type='button'
                  onClick={() => setIsProductModalOpen(true)}
                  disabled={categories.length === 0}
                  className={`rounded-full bg-dark-red px-5 py-3 text-sm font-semibold text-white ${
                    categories.length === 0
                      ? 'cursor-not-allowed opacity-50'
                      : 'shadow-sm transition hover:bg-[#5c030f]'
                  }`}
                >
                  Add product
                </button>
              </div>
            </div>
          </header>

          <section className='grid grid-cols-1 gap-5 xl:grid-cols-4'>
            <StatCard
              label='Total Revenue'
              value={formatCurrency(totalRevenue)}
            />
            <StatCard label='Available Products' value={`${products.length}`} />
            <StatCard
              label='Best Selling Product'
              value={featuredProduct?.name ?? '—'}
            />
            <StatCard
              label='Trending Product'
              value={trendingProduct?.name ?? '—'}
            />
          </section>

          <section className='mt-8 grid gap-5 xl:grid-cols-3'>
            <InsightCard
              title='Insights'
              description='No order data yet. Product insights will appear here once sales are active.'
            />
            <InsightCard title='Insights' description='' />
            <InsightCard title='Insights' description='' />
          </section>

          <section className='mt-10 rounded-4xl border border-[#d5bd9d] bg-[#f7efe6] p-6 shadow-sm'>
            <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-black'>
                  Product performance
                </h2>
                <p className='text-sm text-[#6D5A46]'>
                  {filteredProducts.length} of {products.length} products
                </p>
              </div>

              <div className='flex flex-col gap-3 sm:flex-row'>
                <input
                  type='search'
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='Search products'
                  className='w-full min-w-55 rounded-full border border-[#d5bd9d] bg-white/90 px-4 py-3 text-sm text-dark-red outline-none focus:border-dark-red focus:ring-2 focus:ring-[#F4E0D4]'
                />
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as 'all' | 'active' | 'hidden',
                    )
                  }
                  className='w-full min-w-40 rounded-full border border-[#d5bd9d] bg-white/90 px-4 py-3 text-sm text-dark-red outline-none focus:border-dark-red focus:ring-2 focus:ring-[#F4E0D4]'
                >
                  <option value='all'>All statuses</option>
                  <option value='active'>Active</option>
                  <option value='hidden'>Hidden</option>
                </select>
              </div>
            </div>

            <div className='overflow-hidden rounded-[28px] border border-[#c8b49c] bg-white shadow-sm'>
              <table className='min-w-full border-collapse text-left text-sm'>
                <thead className='bg-[#F7EEE1]'>
                  <tr>
                    <TableHeader>Product</TableHeader>
                    <TableHeader>Category</TableHeader>
                    <TableHeader>Price</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Performance</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className='px-6 py-8 text-center text-sm text-[#6D5A46]'
                      >
                        No products found for current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className='border-t border-[#E7D7C2] hover:bg-[#F4E0D4]/50'
                      >
                        <td className='px-6 py-4'>
                          <div className='font-semibold text-black'>
                            {product.name}
                          </div>
                          <div className='text-xs text-[#6D5A46]'>
                            {product.brand ?? 'Brand not set'}
                          </div>
                        </td>
                        <td className='px-6 py-4 text-dark-red'>
                          {product.category}
                        </td>
                        <td className='px-6 py-4 text-dark-red'>
                          {formatCurrency(
                            product.discountPrice ?? product.price,
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                              product.status === 'active'
                                ? 'bg-[#3bb24a] text-white'
                                : 'bg-[#6d5a46] text-white'
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='rounded-full bg-[#F4E0D4] px-3 py-1 text-xs font-semibold text-[#6D5A46]'>
                            {product.performance}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <Modal
        open={isProductModalOpen}
        title='Add new product'
        onClose={() => setIsProductModalOpen(false)}
        footer={
          <div className='flex flex-wrap items-center justify-end gap-3'>
            <button
              type='button'
              className='rounded-full border border-[#6D5A46] bg-white px-4 py-2 text-sm font-semibold text-[#6D5A46]'
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type='submit'
              form='product-form'
              className='rounded-full bg-dark-red px-5 py-2 text-sm font-semibold text-white'
            >
              Publish product
            </button>
          </div>
        }
      >
        <form
          id='product-form'
          onSubmit={handleAddProduct}
          className='space-y-5'
        >
          <div className='grid gap-5 md:grid-cols-2'>
            <FormField
              label='Product name'
              value={formState.name}
              onChange={(value) => handleProductChange('name', value)}
            />
            <FormField
              label='Brand'
              value={formState.brand}
              onChange={(value) => handleProductChange('brand', value)}
            />
          </div>

          <div className='grid gap-5 md:grid-cols-2'>
            <SelectField
              label='Category'
              value={formState.categoryId}
              onChange={(value) => handleProductChange('categoryId', value)}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />
            <div className='flex items-end gap-3'>
              <SelectField
                label='Placement'
                value={formState.primaryPlacement}
                onChange={(value) =>
                  handleProductChange('primaryPlacement', value)
                }
                options={['Homepage', 'Collection', 'Featured'].map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(true)}
                className='rounded-full bg-[#F3E6D9] px-4 py-3 text-sm font-semibold text-[#6D5A46] transition hover:bg-[#E5D2BD]'
              >
                New category
              </button>
            </div>
          </div>

          <div className='grid gap-5 md:grid-cols-2'>
            <FormField
              label='Price'
              value={formState.price}
              onChange={(value) => handleProductChange('price', value)}
              type='number'
            />
            <FormField
              label='Discount price'
              value={formState.discountPrice}
              onChange={(value) => handleProductChange('discountPrice', value)}
              type='number'
            />
          </div>

          <FormField
            label='Description'
            value={formState.description}
            onChange={(value) => handleProductChange('description', value)}
            textarea
          />

          <div className='grid gap-5 md:grid-cols-2'>
            <FormField
              label='Promo code'
              value={formState.promoCode}
              onChange={(value) => handleProductChange('promoCode', value)}
            />
            <FormField
              label='Campaign'
              value={formState.campaign}
              onChange={(value) => handleProductChange('campaign', value)}
            />
          </div>

          <FormField
            label='Collection'
            value={formState.collection}
            onChange={(value) => handleProductChange('collection', value)}
          />

          <div className='grid gap-5 md:grid-cols-2'>
            <FormField
              label='Slug'
              value={formState.slug}
              onChange={(value) => handleProductChange('slug', value)}
            />
            <FormField
              label='Meta title'
              value={formState.metaTitle}
              onChange={(value) => handleProductChange('metaTitle', value)}
            />
          </div>

          <FormField
            label='Meta description'
            value={formState.metaDescription}
            onChange={(value) => handleProductChange('metaDescription', value)}
            textarea
          />

          <ImageUpload
            onFilesSelected={(newFiles) =>
              setPendingImages((current) => [
                ...current,
                ...newFiles.map((file) => ({
                  file,
                  previewUrl: URL.createObjectURL(file),
                })),
              ])
            }
            disabled={false}
          />

          <ImagePreview
            images={previewUrls}
            onRemove={(index) =>
              setPendingImages((current) => {
                URL.revokeObjectURL(current[index].previewUrl);
                return current.filter((_, i) => i !== index);
              })
            }
          />

          <div className='grid gap-5 md:grid-cols-2'>
            <SelectField
              label='Status'
              value={formState.status}
              onChange={(value) => handleProductChange('status', value)}
              options={['active', 'hidden'].map((item) => ({
                value: item,
                label: item,
              }))}
            />
            <SelectField
              label='Performance'
              value={formState.performance}
              onChange={(value) => handleProductChange('performance', value)}
              options={['new arrival', 'recommended', 'featured'].map(
                (item) => ({
                  value: item,
                  label: item,
                }),
              )}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={isCategoryModalOpen}
        title='Add new category'
        onClose={() => setIsCategoryModalOpen(false)}
        footer={
          <div className='flex items-center justify-end gap-3'>
            <button
              type='button'
              className='rounded-full border border-[#6D5A46] bg-white px-4 py-2 text-sm font-semibold text-[#6D5A46]'
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type='submit'
              form='category-form'
              className='rounded-full bg-dark-red px-5 py-2 text-sm font-semibold text-white'
            >
              Add category
            </button>
          </div>
        }
      >
        <form
          id='category-form'
          onSubmit={handleAddCategory}
          className='space-y-5'
        >
          <FormField
            label='Category name'
            value={categoryName}
            onChange={setCategoryName}
          />
          <p className='text-sm text-[#6D5A46]'>
            Categories are used to organize products in the analytics table and
            product form.
          </p>
        </form>
      </Modal>
    </AdminLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-[28px] border border-[#d5bd9d] bg-white p-6 shadow-sm transition hover:-translate-y-1'>
      <p className='text-sm uppercase tracking-[0.2em] text-[#6D5A46] font-semibold'>
        {label}
      </p>
      <div className='mt-4 text-3xl font-bold text-black'>{value}</div>
    </div>
  );
}

function InsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className='rounded-[28px] border border-[#d5bd9d] bg-[#F4E0D4]/50 p-6 min-h-45'>
      <h3 className='text-lg font-semibold text-black'>{title}</h3>
      <p className='mt-4 text-sm leading-6 text-[#6D5A46] min-h-20'>
        {description}
      </p>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className='px-6 py-4 text-left text-xs uppercase tracking-[0.25em] text-[#6D5A46]'>
      {children}
    </th>
  );
}

function FormField({
  label,
  value,
  onChange,
  textarea,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className='block text-sm text-[#6D5A46]'>
      <span className='mb-2 block font-semibold text-black'>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className='mt-1 w-full rounded-3xl border border-[#d5bd9d] bg-white/90 px-4 py-3 text-sm text-dark-red outline-none focus:border-dark-red focus:ring-2 focus:ring-[#F4E0D4]'
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className='mt-1 w-full rounded-3xl border border-[#d5bd9d] bg-white/90 px-4 py-3 text-sm text-dark-red outline-none focus:border-dark-red focus:ring-2 focus:ring-[#F4E0D4]'
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className='block text-sm text-[#6D5A46]'>
      <span className='mb-2 block font-semibold text-black'>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='mt-1 w-full rounded-3xl border border-[#d5bd9d] bg-white/90 px-4 py-3 text-sm text-dark-red outline-none focus:border-dark-red focus:ring-2 focus:ring-[#F4E0D4]'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
