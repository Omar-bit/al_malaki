import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Eye, Currency } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { ImagePreview } from '../../components/ui/ImagePreview';
import {
  createCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  getCategories,
  getProducts,
  uploadProductImages,
} from '../../services/productService';
import type {
  CreateProductPayload,
  ProductAnalyticsProduct,
  ProductCategory,
  UpdateCategoryPayload,
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
  //TND
  return new Intl.NumberFormat("en-US",{
    style:"currency",
    currency:"TND",
    maximumFractionDigits:0
  }).format(value)
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
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] =
    useState<ProductAnalyticsProduct | null>(null);
  const [deletingProduct, setDeletingProduct] =
    useState<ProductAnalyticsProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>(
    'all',
  );
  const [formState, setFormState] = useState(() => ({ ...initialFormState }));
  // ── Category management state ──
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#D4B896');
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('#D4B896');
  const [editCategoryImageFile, setEditCategoryImageFile] = useState<File | null>(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
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
    setEditingProductId(null);
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

  const handleEditClick = (product: ProductAnalyticsProduct) => {
    setEditingProductId(product.id);
    const categoryId =
      categories.find((c) => c.name === product.category)?.id ||
      categories[0]?.id ||
      '';

    setFormState({
      name: product.name,
      categoryId,
      brand: product.brand || '',
      description: product.description || '',
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() || '',
      images: product.images || [],
      primaryPlacement: product.primaryPlacement || 'Homepage',
      collection: product.collection || '',
      promoCode: product.promoCode || '',
      campaign: product.campaign || '',
      status: product.status,
      performance: product.performance,
      slug: product.slug,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
    });
    setPendingImages([]);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      setProducts((current) =>
        current.filter((p) => p.id !== deletingProduct.id),
      );
      toast.success('Product deleted successfully.');
      setDeletingProduct(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete product.');
    }
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
    let imageUrls: string[] = [...formState.images];
    if (pendingImages.length > 0) {
      try {
        const result = await uploadProductImages(
          pendingImages.map((i) => i.file),
        );
        imageUrls = [...imageUrls, ...result.urls];
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
      images: imageUrls, // uploaded URLs
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
      if (editingProductId) {
        const updatedProduct = await updateProduct(editingProductId, payload);
        setProducts((current) =>
          current.map((p) => (p.id === editingProductId ? updatedProduct : p)),
        );
        toast.success('Product updated successfully.');
      } else {
        const createdProduct = await createProduct(payload);
        setProducts((current) => [createdProduct, ...current]);
        toast.success('Product created successfully.');
      }
      resetForm();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to save product. Please try again.',
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
      // Upload image first if one was picked
      let imageUrl: string | undefined;
      if (categoryImageFile) {
        const result = await uploadCategoryImage(categoryImageFile);
        imageUrl = result.url;
      }
      const addedCategory = await createCategory({
        name: trimmedName,
        color: categoryColor,
        image: imageUrl,
      });
      setCategories((current) => [...current, addedCategory]);
      setCategoryName('');
      setCategoryColor('#D4B896');
      setCategoryImageFile(null);
      if (categoryImagePreview) {
        URL.revokeObjectURL(categoryImagePreview);
        setCategoryImagePreview(null);
      }
      setFormState((current) => ({
        ...current,
        categoryId: current.categoryId || addedCategory.id,
      }));
      toast.success('Category added successfully.');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to add category. Please try again.',
      );
    }
  };

  const startEditCategory = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
    setEditCategoryColor(cat.color || '#D4B896');
    setEditCategoryImageFile(null);
    setEditCategoryImagePreview(cat.image || null);
  };

  const cancelEditCategory = () => {
    if (editCategoryImageFile && editCategoryImagePreview) {
      URL.revokeObjectURL(editCategoryImagePreview);
    }
    setEditingCategory(null);
    setEditCategoryImageFile(null);
    setEditCategoryImagePreview(null);
  };

  const handleUpdateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCategory) return;
    const trimmedName = editCategoryName.trim();
    if (!trimmedName) {
      toast.error('Category name cannot be empty.');
      return;
    }
    try {
      let imageUrl: string | undefined = editingCategory.image;
      if (editCategoryImageFile) {
        const result = await uploadCategoryImage(editCategoryImageFile);
        imageUrl = result.url;
      }
      const payload: UpdateCategoryPayload = {
        name: trimmedName,
        color: editCategoryColor,
        image: imageUrl,
      };
      const updated = await updateCategory(editingCategory.id, payload);
      setCategories((current) =>
        current.map((c) => (c.id === updated.id ? updated : c)),
      );
      cancelEditCategory();
      toast.success('Category updated.');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update category.',
      );
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((current) => current.filter((c) => c.id !== id));
      setDeletingCategoryId(null);
      // If the deleted category was selected in the product form, reset
      setFormState((current) =>
        current.categoryId === id
          ? { ...current, categoryId: categories.find((c) => c.id !== id)?.id ?? '' }
          : current,
      );
      toast.success('Category deleted.');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete category.',
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
                  Manage categories
                </button>
                <button
                  type='button'
                  onClick={() => setIsProductModalOpen(true)}
                  disabled={categories.length === 0}
                  className={`rounded-full bg-dark-red px-5 py-3 text-sm font-semibold text-white ${categories.length === 0
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
                    <TableHeader>Actions</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
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
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${product.status === 'active'
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
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            <button
                              type='button'
                              title='View Details'
                              onClick={() => setViewingProduct(product)}
                              className='rounded p-2 text-[#6D5A46] transition hover:bg-[#E7D7C2] hover:text-black'
                            >
                              <Eye className='h-4 w-4' />
                            </button>
                            <button
                              type='button'
                              title='Edit Product'
                              onClick={() => handleEditClick(product)}
                              className='rounded p-2 text-[#6D5A46] transition hover:bg-[#E7D7C2] hover:text-black'
                            >
                              <Pencil className='h-4 w-4' />
                            </button>
                            <button
                              type='button'
                              title='Delete Product'
                              onClick={() => setDeletingProduct(product)}
                              className='rounded p-2 text-dark-red transition hover:bg-red-100 hover:text-red-700'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
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
        title={editingProductId ? 'Edit product' : 'Add new product'}
        onClose={() => {
          setIsProductModalOpen(false);
          resetForm();
        }}
        footer={
          <div className='flex flex-wrap items-center justify-end gap-3'>
            <button
              type='button'
              className='rounded-full border border-[#6D5A46] bg-white px-4 py-2 text-sm font-semibold text-[#6D5A46]'
              onClick={() => {
                setIsProductModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type='submit'
              form='product-form'
              className='rounded-full bg-dark-red px-5 py-2 text-sm font-semibold text-white'
            >
              {editingProductId ? 'Save changes' : 'Publish product'}
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
                Manage
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

          {formState.images.length > 0 && (
            <ImagePreview
              title='Existing Images'
              images={formState.images}
              onRemove={(index) =>
                setFormState((current) => ({
                  ...current,
                  images: current.images.filter((_, i) => i !== index),
                }))
              }
            />
          )}

          <ImagePreview
            title={formState.images.length > 0 ? 'New Images' : 'Image Preview'}
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

      {/* ── Manage Categories Modal ── */}
      <Modal
        open={isCategoryModalOpen}
        title='Manage categories'
        onClose={() => {
          setIsCategoryModalOpen(false);
          cancelEditCategory();
          setCategoryName('');
          setCategoryColor('#D4B896');
          setCategoryImageFile(null);
          if (categoryImagePreview) { URL.revokeObjectURL(categoryImagePreview); setCategoryImagePreview(null); }
        }}
        footer={
          <div className='flex items-center justify-end'>
            <button
              type='button'
              className='rounded-full border border-[#6D5A46] bg-white px-4 py-2 text-sm font-semibold text-[#6D5A46]'
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Done
            </button>
          </div>
        }
      >
        <div className='space-y-6'>
          {/* Category list */}
          <div className='space-y-2'>
            {categories.length === 0 && (
              <p className='py-4 text-center text-sm text-[#6D5A46]'>No categories yet. Add one below.</p>
            )}
            {categories.map((cat) =>
              editingCategory?.id === cat.id ? (
                /* ── Inline edit row ── */
                <form
                  key={cat.id}
                  onSubmit={handleUpdateCategory}
                  className='rounded-2xl border border-dark-red/30 bg-[#FFF8F3] p-3 space-y-3'
                >
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <label className='block text-sm'>
                      <span className='mb-1 block font-semibold text-black'>Name</span>
                      <input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className='w-full rounded-2xl border border-[#d5bd9d] bg-white px-3 py-2 text-sm text-dark-red outline-none focus:border-dark-red focus:ring-2 focus:ring-[#F4E0D4]'
                      />
                    </label>
                    <label className='block text-sm'>
                      <span className='mb-1 block font-semibold text-black'>Color</span>
                      <div className='flex items-center gap-2'>
                        <input
                          type='color'
                          value={editCategoryColor}
                          onChange={(e) => setEditCategoryColor(e.target.value)}
                          className='h-9 w-14 cursor-pointer rounded-xl border border-[#d5bd9d] p-0.5'
                        />
                        <span className='text-xs text-[#6D5A46]'>{editCategoryColor}</span>
                      </div>
                    </label>
                  </div>
                  {/* Image upload */}
                  <div>
                    <span className='mb-1 block text-sm font-semibold text-black'>Image (optional)</span>
                    <label className='flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#d5bd9d] bg-white px-4 py-3 hover:border-dark-red'>
                      {editCategoryImagePreview ? (
                        <img src={editCategoryImagePreview} alt='preview' className='h-10 w-10 rounded-lg object-cover' />
                      ) : (
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4E0D4]'>
                          <svg className='h-5 w-5 text-[#6D5A46]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' />
                          </svg>
                        </div>
                      )}
                      <span className='text-sm text-[#6D5A46]'>
                        {editCategoryImagePreview ? 'Change image' : 'Upload image'}
                      </span>
                      <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (editCategoryImageFile && editCategoryImagePreview) URL.revokeObjectURL(editCategoryImagePreview);
                          setEditCategoryImageFile(file);
                          setEditCategoryImagePreview(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                  </div>
                  <div className='flex justify-end gap-2'>
                    <button type='button' onClick={cancelEditCategory} className='rounded-full border border-[#6D5A46] bg-white px-3 py-1.5 text-xs font-semibold text-[#6D5A46]'>Cancel</button>
                    <button type='submit' className='rounded-full bg-dark-red px-3 py-1.5 text-xs font-semibold text-white'>Save</button>
                  </div>
                </form>
              ) : (
                /* ── Read row ── */
                <div
                  key={cat.id}
                  className='flex items-center gap-3 rounded-2xl border border-[#E7D7C2] bg-white px-4 py-3'
                >
                  {/* Visual: image OR color swatch */}
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className='h-9 w-9 rounded-lg object-cover flex-shrink-0' />
                  ) : (
                    <div
                      className='h-9 w-9 rounded-lg flex-shrink-0 border border-[#d5bd9d]'
                      style={{ background: cat.color || '#F4E0D4' }}
                    />
                  )}
                  <span className='flex-1 text-sm font-semibold text-black'>{cat.name}</span>
                  {/* Confirm delete inline */}
                  {deletingCategoryId === cat.id ? (
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-dark-red'>Delete?</span>
                      <button
                        type='button'
                        onClick={() => handleDeleteCategory(cat.id)}
                        className='rounded-full bg-dark-red px-2.5 py-1 text-xs font-semibold text-white'
                      >Yes</button>
                      <button
                        type='button'
                        onClick={() => setDeletingCategoryId(null)}
                        className='rounded-full border border-[#6D5A46] px-2.5 py-1 text-xs font-semibold text-[#6D5A46]'
                      >No</button>
                    </div>
                  ) : (
                    <div className='flex items-center gap-1'>
                      <button
                        type='button'
                        title='Edit'
                        onClick={() => startEditCategory(cat)}
                        className='rounded p-1.5 text-[#6D5A46] hover:bg-[#F4E0D4] hover:text-black'
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </button>
                      <button
                        type='button'
                        title='Delete'
                        onClick={() => setDeletingCategoryId(cat.id)}
                        className='rounded p-1.5 text-dark-red hover:bg-red-100'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {/* Divider */}
          <div className='border-t border-[#E7D7C2]' />

          {/* Add new category form */}
          <form onSubmit={handleAddCategory} className='space-y-3'>
            <p className='text-sm font-semibold text-black'>Add new category</p>
            <div className='grid gap-3 sm:grid-cols-2'>
              <label className='block text-sm'>
                <span className='mb-1 block font-semibold text-[#6D5A46]'>Name</span>
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder='e.g. Perfumes'
                  className='w-full rounded-2xl border border-[#d5bd9d] bg-white px-3 py-2 text-sm text-dark-red outline-none focus:border-dark-red focus:ring-2 focus:ring-[#F4E0D4]'
                />
              </label>
              <label className='block text-sm'>
                <span className='mb-1 block font-semibold text-[#6D5A46]'>Color</span>
                <div className='flex items-center gap-2'>
                  <input
                    type='color'
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className='h-9 w-14 cursor-pointer rounded-xl border border-[#d5bd9d] p-0.5'
                  />
                  <span className='text-xs text-[#6D5A46]'>{categoryColor}</span>
                </div>
              </label>
            </div>
            {/* Image upload */}
            <div>
              <span className='mb-1 block text-sm font-semibold text-[#6D5A46]'>Image (optional)</span>
              <label className='flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#d5bd9d] bg-white px-4 py-3 hover:border-dark-red'>
                {categoryImagePreview ? (
                  <img src={categoryImagePreview} alt='preview' className='h-10 w-10 rounded-lg object-cover' />
                ) : (
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4E0D4]'>
                    <svg className='h-5 w-5 text-[#6D5A46]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' />
                    </svg>
                  </div>
                )}
                <span className='text-sm text-[#6D5A46]'>
                  {categoryImagePreview ? 'Change image' : 'Upload image'}
                </span>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (categoryImageFile && categoryImagePreview) URL.revokeObjectURL(categoryImagePreview);
                    setCategoryImageFile(file);
                    setCategoryImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
            <div className='flex justify-end'>
              <button type='submit' className='rounded-full bg-dark-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5c030f]'>
                Add category
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        open={!!viewingProduct}
        title='Product Details'
        onClose={() => setViewingProduct(null)}
        footer={
          <div className='flex items-center justify-end gap-3'>
            <button
              type='button'
              className='rounded-full border border-[#6D5A46] bg-white px-4 py-2 text-sm font-semibold text-[#6D5A46]'
              onClick={() => setViewingProduct(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {viewingProduct && (
          <div className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              {viewingProduct.images.length > 0 ? (
                <div className='h-64 overflow-y-auto rounded-2xl bg-[#F7EEE1] p-4'>
                  <ImagePreview images={viewingProduct.images} readOnly={true} />
                </div>
              ) : (
                <div className='flex h-64 w-full items-center justify-center rounded-2xl bg-[#F7EEE1] text-[#6D5A46]'>
                  No image available
                </div>
              )}
              <div className='space-y-4'>
                <div>
                  <h3 className='text-2xl font-bold text-black'>
                    {viewingProduct.name}
                  </h3>
                  <p className='text-sm text-[#6D5A46]'>
                    Brand: {viewingProduct.brand || 'Not set'}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='rounded-full bg-[#F4E0D4] px-3 py-1 text-xs font-semibold text-dark-red'>
                    {viewingProduct.category}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white ${viewingProduct.status === 'active'
                      ? 'bg-[#3bb24a]'
                      : 'bg-[#6d5a46]'
                      }`}
                  >
                    {viewingProduct.status}
                  </span>
                </div>
                <div>
                  <div className='text-lg font-semibold text-dark-red'>
                    {formatCurrency(
                      viewingProduct.discountPrice ?? viewingProduct.price,
                    )}
                  </div>
                  {viewingProduct.discountPrice && (
                    <div className='text-sm text-gray-500 line-through'>
                      {formatCurrency(viewingProduct.price)}
                    </div>
                  )}
                </div>
                {viewingProduct.description && (
                  <div>
                    <h4 className='mb-1 font-semibold text-black'>
                      Description
                    </h4>
                    <p className='text-sm text-[#6D5A46]'>
                      {viewingProduct.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className='grid gap-4 rounded-2xl bg-[#F7EEE1] p-4 md:grid-cols-2'>
              <div>
                <span className='block text-xs font-semibold uppercase tracking-wider text-[#6D5A46]'>
                  Placement
                </span>
                <span className='text-sm text-black'>
                  {viewingProduct.primaryPlacement || 'Not set'}
                </span>
              </div>
              <div>
                <span className='block text-xs font-semibold uppercase tracking-wider text-[#6D5A46]'>
                  Collection
                </span>
                <span className='text-sm text-black'>
                  {viewingProduct.collection || 'Not set'}
                </span>
              </div>
              <div>
                <span className='block text-xs font-semibold uppercase tracking-wider text-[#6D5A46]'>
                  Promo Code
                </span>
                <span className='text-sm text-black'>
                  {viewingProduct.promoCode || 'Not set'}
                </span>
              </div>
              <div>
                <span className='block text-xs font-semibold uppercase tracking-wider text-[#6D5A46]'>
                  Campaign
                </span>
                <span className='text-sm text-black'>
                  {viewingProduct.campaign || 'Not set'}
                </span>
              </div>
              <div>
                <span className='block text-xs font-semibold uppercase tracking-wider text-[#6D5A46]'>
                  Performance
                </span>
                <span className='text-sm text-black'>
                  {viewingProduct.performance}
                </span>
              </div>
              <div>
                <span className='block text-xs font-semibold uppercase tracking-wider text-[#6D5A46]'>
                  Slug
                </span>
                <span className='text-sm text-black'>
                  {viewingProduct.slug}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deletingProduct}
        title='Confirm Deletion'
        onClose={() => setDeletingProduct(null)}
        footer={
          <div className='flex items-center justify-end gap-3'>
            <button
              type='button'
              className='rounded-full border border-[#6D5A46] bg-white px-4 py-2 text-sm font-semibold text-[#6D5A46]'
              onClick={() => setDeletingProduct(null)}
            >
              Cancel
            </button>
            <button
              type='button'
              className='rounded-full bg-dark-red px-5 py-2 text-sm font-semibold text-white'
              onClick={handleDeleteProduct}
            >
              Delete Product
            </button>
          </div>
        }
      >
        {deletingProduct && (
          <div className='py-4'>
            <p className='text-[#6D5A46]'>
              Are you sure you want to delete{' '}
              <strong className='text-black'>{deletingProduct.name}</strong>?
              This action cannot be undone.
            </p>
          </div>
        )}
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
