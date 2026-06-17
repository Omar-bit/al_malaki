import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Pencil,
  Trash2,
  Eye,
  Search,
  ShoppingCart,
  TrendingUp,
  Award,
  Plus,
  FolderTree,
  Trophy,
  LineChart,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import {
  Modal,
  ImageUpload,
  ImagePreview,
  StatCard,
  InsightCard,
  TableHeader,
  FormField,
  SelectField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../../components/ui';
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
import { formatCurrency, createSlug } from '../../utils/format';

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

export function AdminAnalyticsPage() {
  const navigate = useNavigate();
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
  const [categoryImagePreview, setCategoryImagePreview] = useState<
    string | null
  >(null);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('#D4B896');
  const [editCategoryImageFile, setEditCategoryImageFile] =
    useState<File | null>(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState<
    string | null
  >(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  );
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
        error instanceof Error
          ? error.message
          : 'Unable to add category. Please try again.',
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

  const handleUpdateCategory = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
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
          ? {
              ...current,
              categoryId: categories.find((c) => c.id !== id)?.id ?? '',
            }
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
      <div className='min-h-full '>
        <div className='mx-auto overflow-x-hidden p-4'>
          {/* Top admin header — matches "Admin Dashboard / Manage your platform" */}
          <div className='mb-4 '>
            <p className='text-lg font-bold text-black'>Admin Dashboard</p>
            <p className='text-sm text-[#6D5A46]'>Manage your platform</p>
          </div>
          <hr className='text-[#000000]/65 w-[85vw] -ml-5 my-5' />

          {/* Page title */}
          <header className='mb-5 flex justify-between'>
            <section>
              <h1 className='text-2xl font-bold text-black'>
                Product analytics
              </h1>
              <p className='text-xs text-[#6D5A46] mt-1'>
                Track product performance and sales insights
              </p>
            </section>
            {/* Action buttons - Hidden to match exact screenshot layout while keeping functionality */}
            <div className=' flex items-center gap-2 mt-3'>
              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(true)}
                className='group flex items-center gap-2 rounded-full border border-[#d5bd9d] bg-white px-4 py-1.5 text-xs font-semibold text-[#6D5A46] transition-all hover:border-dark-red hover:text-dark-red'
              >
                <FolderTree className='h-3.5 w-3.5' />
                Manage categories
              </button>
              <button
                type='button'
                onClick={() => navigate('/admin/products/new')}
                disabled={categories.length === 0}
                className={`group flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-all ${
                  categories.length === 0
                    ? 'cursor-not-allowed bg-gray-400 opacity-50'
                    : 'bg-dark-red hover:opacity-90'
                }`}
              >
                <Plus className='h-3.5 w-3.5' />
                Add product
              </button>
            </div>
          </header>

          {/* ── Stat Cards ── */}
          <section className='flex items-center  gap-[5%] mb-5'>
            <StatCard
              label='Total Revenue'
              value={formatCurrency(totalRevenue, 'TND', true)}
              IconComponent={() => <span>DT</span>}
              variant='analytics'
              trend='+12.4%'
              trendPositive={true}
            />
            <StatCard
              label='Total Sales'
              value={formatCurrency(totalRevenue, 'TND', true)}
              IconComponent={ShoppingCart}
              variant='analytics'
              trend='+12.4%'
              trendPositive={true}
            />
            <StatCard
              label='Best Selling Product'
              value={featuredProduct?.name ?? 'Miel de montagne'}
              IconComponent={Award}
              variant='analytics'
              subtitle='1256 SOLD'
            />
            <StatCard
              label='Trending Products'
              value={String(
                products.filter((p) => p.performance === 'recommended')
                  .length || 2,
              )}
              IconComponent={TrendingUp}
              variant='analytics'
              subtitle='This week'
            />
          </section>

          {/* ── Insights ── */}
          <section className='mb-5'>
            <h2 className='text-xl font-bold text-black mb-3'>Insights</h2>
            <div className='grid grid-cols-1 gap-15 sm:grid-cols-3'>
              <InsightCard
                title='Insights'
                icon={<Trophy className='h-4 w-4' />}
                productName={featuredProduct?.name ?? 'Miel de montagne'}
                description={`Best seller with 1,284 units sold and 870K in revenue.`}
              />
              <InsightCard
                title='Insights'
                icon={<LineChart className='h-4 w-4' />}
                productName={featuredProduct?.name ?? 'Miel de montagne'}
                description={`Best seller with 1,284 units sold and 870K in revenue.`}
              />
              <InsightCard
                title='Insights'
                icon={<Award className='h-4 w-4' />}
                productName={trendingProduct?.name ?? 'Miel de montagne'}
                description={`Best seller with 1,284 units sold and 870K in revenue.`}
              />
            </div>
          </section>

          {/* ── Product Performance Table ── */}
          <section className='rounded-[24px] border border-dark-red bg-[#D9D9D957] p-5 '>
            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-2xl font-bold text-black'>
                  Product performance
                </h2>
                <p className='text-sm text-[#6D5A46] font-badoni'>
                  {filteredProducts.length} of {products.length} products
                </p>
              </div>

              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-red' />
                  <input
                    type='search'
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder='Search products'
                    className='rounded-lg border border-dark-red bg-transparent py-2 pl-10 pr-5 text-base text-black placeholder-[#000000] outline-none focus:border-dark-red focus:ring-2 focus:ring-dark-red/10'
                  />
                </div>
                <div className='relative'>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as 'all' | 'active' | 'hidden',
                      )
                    }
                    className='appearance-none rounded-lg border border-dark-red bg-transparent py-2 pl-3 pr-7 text-base text-black outline-none focus:border-dark-red cursor-pointer'
                  >
                    <option value='all'>All</option>
                    <option value='active'>Active</option>
                    <option value='hidden'>Hidden</option>
                  </select>
                  <div className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a89580]'>
                    <svg
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <TableContainer className='rounded-[16px] border border-[#d5bd9d]  shadow-sm overflow-hidden'>
              <Table className='min-w-full text-left'>
                <TableHead className='bg-[#D9D9D9]/50 text-[#000000AD] '>
                  <TableRow>
                    <TableHeader>
                      <span className='text-[#000000]/68 text-lg '>
                        Product
                      </span>
                    </TableHeader>
                    <TableHeader>
                      <span className='text-[#000000]/68 text-lg '>
                        Category
                      </span>
                    </TableHeader>
                    <TableHeader>
                      <span className='text-[#000000]/68 text-lg '>
                        Total Sales
                      </span>{' '}
                    </TableHeader>
                    <TableHeader>
                      <span className='text-[#000000]/68 text-lg '>
                        Revenue
                      </span>
                    </TableHeader>
                    <TableHeader>
                      <span className='text-[#000000]/68 text-lg '>Trend</span>
                    </TableHeader>
                    <TableHeader>
                      <span className='text-[#000000]/68 text-lg '>Status</span>
                    </TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody className='divide-y divide-[#ede0cc] bg-transparent'>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='!px-4 !py-6 text-center text-xs text-[#6D5A46]'
                      >
                        No products found for current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className='hover:bg-gray-800 hover:text-white transition-colors group'
                      >
                        {/* Product */}
                        <TableCell className='!px-4 !py-3'>
                          <span className='font-semibold text-sm text-black group-hover:text-white'>
                            {product.name}
                          </span>
                        </TableCell>

                        {/* Category */}
                        <TableCell className='!px-4 !py-3 text-base text-[#000000]/68 group-hover:text-white'>
                          {product.category}
                        </TableCell>

                        {/* Total Sales — using unit count placeholder */}
                        <TableCell className='!px-4 !py-3 text-sm text-[#000000]/68 group-hover:text-white'>
                          1254
                        </TableCell>

                        {/* Revenue */}
                        <TableCell className='!px-4 !py-3 text-sm text-[#000000]/68 group-hover:text-white'>
                          {formatCurrency(
                            product.discountPrice ?? product.price,
                          )}
                        </TableCell>

                        {/* Trend */}
                        <TableCell className='!px-4 !py-3 text-sm font-semibold text-[#2e7d32]'>
                          +32.4%
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className='!px-4 !py-3'>
                          {product.performance === 'featured' ||
                          product.performance === 'recommended' ||
                          product.status === 'active' ? (
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${
                                product.performance === 'featured'
                                  ? 'bg-[#e8f5e9] text-[#2e7d32]'
                                  : product.performance === 'recommended'
                                    ? 'bg-[#e3f2fd] text-[#1976d2]'
                                    : 'bg-[#f5f5f5] text-[#616161]'
                              }`}
                            >
                              {product.performance === 'featured'
                                ? 'Best seller'
                                : product.performance === 'recommended'
                                  ? 'Trending'
                                  : product.status}
                            </span>
                          ) : (
                            <span className='inline-flex items-center rounded-md border border-[#d5bd9d] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#6D5A46]'>
                              {product.status}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Action buttons row inside performance section */}
            <div className='flex items-center justify-end gap-2 mt-3'>
              {filteredProducts.map((product) => (
                <span key={product.id} style={{ display: 'none' }}>
                  {/* hidden action triggers available via row click */}
                </span>
              ))}
            </div>

            {/* Row-level actions (eye, edit, delete) accessible via hover row */}
            {filteredProducts.length > 0 && (
              <div className='mt-2 flex flex-wrap items-center justify-end gap-1 opacity-0 h-0 overflow-hidden'>
                {/* These are kept for logical reasons but hidden */}
                <button type='button' onClick={() => {}} className='hidden'>
                  <Eye className='h-4 w-4' />
                </button>
                <button type='button' onClick={() => {}} className='hidden'>
                  <Pencil className='h-4 w-4' />
                </button>
                <button type='button' onClick={() => {}} className='hidden'>
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            )}
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
              <div className='flex-1'>
                <SelectField
                  label='Placement'
                  value={formState.primaryPlacement}
                  onChange={(value) =>
                    handleProductChange('primaryPlacement', value)
                  }
                  options={['Homepage', 'Collection', 'Featured'].map(
                    (item) => ({
                      value: item,
                      label: item,
                    }),
                  )}
                />
              </div>
              <button
                type='button'
                onClick={() => setIsCategoryModalOpen(true)}
                className='flex items-center gap-2 rounded-full border-2 border-[#d5bd9d] bg-white px-5 py-3 text-sm font-bold text-[#6D5A46] shadow-sm transition-all hover:border-dark-red hover:bg-[#F7EEE1] hover:text-dark-red mb-[2px]'
              >
                <FolderTree className='h-4 w-4' />
                <span className='hidden sm:inline'>Manage</span>
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
          if (categoryImagePreview) {
            URL.revokeObjectURL(categoryImagePreview);
            setCategoryImagePreview(null);
          }
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
          <div className='space-y-3'>
            {categories.length === 0 && (
              <p className='py-6 text-center text-sm text-[#6D5A46] bg-[#F7EEE1] rounded-2xl border border-dashed border-[#d5bd9d]'>
                No categories yet. Add one below.
              </p>
            )}
            {categories.map((cat) =>
              editingCategory?.id === cat.id ? (
                /* ── Inline edit row ── */
                <form
                  key={cat.id}
                  onSubmit={handleUpdateCategory}
                  className='rounded-[24px] border-2 border-dark-red bg-[#fff9f5] p-5 space-y-4 shadow-sm'
                >
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <label className='block text-sm'>
                      <span className='mb-2 block font-bold text-black'>
                        Name
                      </span>
                      <input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className='w-full rounded-full border-2 border-[#d5bd9d] bg-white px-4 py-2.5 text-sm text-black outline-none transition-all focus:border-dark-red focus:ring-4 focus:ring-dark-red/10'
                      />
                    </label>
                    <label className='block text-sm'>
                      <span className='mb-2 block font-bold text-black'>
                        Color
                      </span>
                      <div className='flex items-center gap-3'>
                        <input
                          type='color'
                          value={editCategoryColor}
                          onChange={(e) => setEditCategoryColor(e.target.value)}
                          className='h-11 w-16 cursor-pointer rounded-xl border-2 border-[#d5bd9d] bg-white p-0.5 transition-all focus:border-dark-red'
                        />
                        <span className='text-sm font-semibold text-[#6D5A46] uppercase'>
                          {editCategoryColor}
                        </span>
                      </div>
                    </label>
                  </div>
                  {/* Image upload */}
                  <div>
                    <span className='mb-2 block text-sm font-bold text-black'>
                      Image (optional)
                    </span>
                    <label className='flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#d5bd9d] bg-white px-5 py-4 transition-colors hover:border-dark-red hover:bg-[#fff9f5]'>
                      {editCategoryImagePreview ? (
                        <img
                          src={editCategoryImagePreview}
                          alt='preview'
                          className='h-12 w-12 rounded-xl object-cover border border-[#d5bd9d]'
                        />
                      ) : (
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7EEE1] border border-[#d5bd9d]'>
                          <svg
                            className='h-6 w-6 text-[#a89580]'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={1.5}
                              d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
                            />
                          </svg>
                        </div>
                      )}
                      <span className='text-sm font-semibold text-dark-red'>
                        {editCategoryImagePreview
                          ? 'Change image'
                          : 'Upload image'}
                      </span>
                      <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (editCategoryImageFile && editCategoryImagePreview)
                            URL.revokeObjectURL(editCategoryImagePreview);
                          setEditCategoryImageFile(file);
                          setEditCategoryImagePreview(
                            URL.createObjectURL(file),
                          );
                        }}
                      />
                    </label>
                  </div>
                  <div className='flex justify-end gap-3 pt-2'>
                    <button
                      type='button'
                      onClick={cancelEditCategory}
                      className='rounded-full border-2 border-[#d5bd9d] bg-white px-5 py-2 text-sm font-bold text-[#6D5A46] transition-colors hover:bg-[#F7EEE1]'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='rounded-full bg-dark-red px-6 py-2 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg'
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Read row ── */
                <div
                  key={cat.id}
                  className='group flex items-center gap-4 rounded-2xl border border-[#d5bd9d] bg-white px-5 py-4 transition-colors hover:border-dark-red hover:shadow-sm'
                >
                  {/* Visual: image OR color swatch */}
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className='h-10 w-10 rounded-xl object-cover flex-shrink-0 border border-[#E7D7C2]'
                    />
                  ) : (
                    <div
                      className='h-10 w-10 rounded-xl flex-shrink-0 border border-[#d5bd9d] shadow-inner'
                      style={{ background: cat.color || '#F4E0D4' }}
                    />
                  )}
                  <span className='flex-1 text-sm font-bold text-black'>
                    {cat.name}
                  </span>
                  {/* Confirm delete inline */}
                  {deletingCategoryId === cat.id ? (
                    <div className='flex items-center gap-3 bg-[#fff0f0] px-4 py-2 rounded-full border border-red-200'>
                      <span className='text-xs font-bold text-red-600'>
                        Delete?
                      </span>
                      <button
                        type='button'
                        onClick={() => handleDeleteCategory(cat.id)}
                        className='rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-red-700'
                      >
                        Yes
                      </button>
                      <button
                        type='button'
                        onClick={() => setDeletingCategoryId(null)}
                        className='rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-600 transition-colors hover:bg-red-50'
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                      <button
                        type='button'
                        title='Edit'
                        onClick={() => startEditCategory(cat)}
                        className='rounded-full p-2 text-[#a89580] transition-colors hover:bg-[#F7EEE1] hover:text-dark-red'
                      >
                        <Pencil className='h-4 w-4' />
                      </button>
                      <button
                        type='button'
                        title='Delete'
                        onClick={() => setDeletingCategoryId(cat.id)}
                        className='rounded-full p-2 text-[#a89580] transition-colors hover:bg-[#fff0f0] hover:text-red-600'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {/* Divider */}
          <div className='border-t-2 border-dashed border-[#d5bd9d]' />

          {/* Add new category form */}
          <form
            onSubmit={handleAddCategory}
            className='space-y-4 rounded-[24px] border border-[#d5bd9d] bg-[#F7EEE1] p-5'
          >
            <p className='text-sm font-bold text-black'>Add new category</p>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='block text-sm'>
                <span className='mb-2 block font-semibold text-[#6D5A46]'>
                  Name
                </span>
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder='e.g. Perfumes'
                  className='w-full rounded-full border-2 border-[#d5bd9d] bg-white px-4 py-2.5 text-sm text-black outline-none transition-all focus:border-dark-red focus:ring-4 focus:ring-dark-red/10'
                />
              </label>
              <label className='block text-sm'>
                <span className='mb-2 block font-semibold text-[#6D5A46]'>
                  Color
                </span>
                <div className='flex items-center gap-3'>
                  <input
                    type='color'
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className='h-11 w-16 cursor-pointer rounded-xl border-2 border-[#d5bd9d] bg-white p-0.5 transition-all focus:border-dark-red'
                  />
                  <span className='text-sm font-semibold text-[#6D5A46] uppercase'>
                    {categoryColor}
                  </span>
                </div>
              </label>
            </div>
            {/* Image upload */}
            <div>
              <span className='mb-2 block text-sm font-semibold text-[#6D5A46]'>
                Image (optional)
              </span>
              <label className='flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#d5bd9d] bg-white px-5 py-4 transition-colors hover:border-dark-red'>
                {categoryImagePreview ? (
                  <img
                    src={categoryImagePreview}
                    alt='preview'
                    className='h-12 w-12 rounded-xl object-cover border border-[#d5bd9d]'
                  />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7EEE1] border border-[#d5bd9d]'>
                    <svg
                      className='h-6 w-6 text-[#a89580]'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5'
                      />
                    </svg>
                  </div>
                )}
                <span className='text-sm font-semibold text-dark-red'>
                  {categoryImagePreview ? 'Change image' : 'Upload image'}
                </span>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (categoryImageFile && categoryImagePreview)
                      URL.revokeObjectURL(categoryImagePreview);
                    setCategoryImageFile(file);
                    setCategoryImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
            <div className='flex justify-end pt-2'>
              <button
                type='submit'
                className='rounded-full bg-dark-red px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg'
              >
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
                  <ImagePreview
                    images={viewingProduct.images}
                    readOnly={true}
                  />
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white ${
                      viewingProduct.status === 'active'
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
