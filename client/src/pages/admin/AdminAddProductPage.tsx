import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  Image,
  FolderTree,
  Tag,
  Eye,
  Zap,
  Search,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import {
  FormField,
  SelectField,
  ImageUpload,
  ImagePreview,
} from '../../components/ui';
import {
  createProduct,
  getCategories,
  uploadProductImages,
} from '../../services/productService';
import type {
  CreateProductPayload,
  ProductCategory,
} from '../../types/product';
import { createSlug } from '../../utils/format';

interface ProductFormState {
  name: string;
  categoryId: string;
  brand: string;
  description: string;
  price: string;
  discountPrice: string;
  images: string[];
  placement: boolean;
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
  placement: false,
  collection: '',
  promoCode: '',
  campaign: '',
  status: 'active',
  performance: 'new arrival',
  slug: '',
  metaTitle: '',
  metaDescription: '',
};

export function AdminAddProductPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [formState, setFormState] = useState(() => ({ ...initialFormState }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staged images state
  const [pendingImages, setPendingImages] = useState<
    Array<{ file: File; previewUrl: string }>
  >([]);

  const previewUrls = useMemo(
    () => pendingImages.map((item) => item.previewUrl),
    [pendingImages],
  );

  // Load categories on mount
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const categoryData = await getCategories();
        if (!active) return;
        setCategories(categoryData);
        setFormState((current) => ({
          ...current,
          categoryId: current.categoryId || categoryData[0]?.id || '',
        }));
      } catch (error) {
        console.error(error);
        toast.error('Unable to load categories.');
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      pendingImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [pendingImages]);

  const handleFieldChange = (
    key: keyof ProductFormState,
    value: string | string[] | boolean,
  ) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (statusOverride?: 'active' | 'hidden') => {
    if (!formState.categoryId) {
      toast.error('Please select a category before saving the product.');
      return;
    }

    setIsSubmitting(true);

    // Staged files upload
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
        setIsSubmitting(false);
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
      images: imageUrls,
      placement: formState.placement,
      collection: formState.collection.trim() || undefined,
      promoCode: formState.promoCode.trim() || undefined,
      campaign: formState.campaign.trim() || undefined,
      status: statusOverride || formState.status,
      performance: formState.performance,
      slug: formState.slug.trim() || createSlug(formState.name),
      metaTitle: formState.metaTitle.trim() || undefined,
      metaDescription: formState.metaDescription.trim() || undefined,
    };

    try {
      await createProduct(payload);
      toast.success('Product published successfully.');
      navigate('/admin/analytics');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to save product. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AdminLayout>
      <div className='min-h-screen  p-4  font-bona!'>
        <div className='mx-auto '>
          {/* Header */}
          <div className='flex flex-wrap items-center justify-between gap-4  pb-5 mb-8'>
            <div>
              <h1 className='text-3xl font-bold  text-black'>Add Product</h1>
              <p className='text-sm text-[#000000]/68 mt-1'>
                Create a new product with pricing, media, visibility and SEO
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => handleSubmit('hidden')}
                disabled={isSubmitting}
                className='rounded-lg border border-dark-red bg-transparent px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-dark-red/10 shadow-lg'
              >
                Save as draft
              </button>
              <button
                type='button'
                onClick={() => handleSubmit('active')}
                disabled={isSubmitting}
                className='rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md'
              >
                {isSubmitting ? 'Publishing...' : 'Publish product'}
              </button>
            </div>
          </div>

          {/* Form Fields container */}
          <div className='lg:col-span-3 space-y-6'>
            {/* Step 1: Basic Information */}
            <div
              id='step-1'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 1
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <FileText className='h-5 w-5 text-black' />
                  </div>
                  <h2 className='text-xl font-bold text-black'>
                    Basic Information
                  </h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Enter product name, category, brand, and description
                </p>
              </div>

              <div className=''>
                <FormField
                  className='! !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                  label='Product name'
                  value={formState.name}
                  onChange={(value) => handleFieldChange('name', value)}
                  placeholder='eg : Miel de montagne'
                />
              </div>

              <div className='grid gap-5 md:grid-cols-2 items-center'>
                <SelectField
                  className='!bg-[#D9D9D9]/34 border-dark-red !border rounded-lg!'
                  label='Category'
                  value={formState.categoryId}
                  onChange={(value) => handleFieldChange('categoryId', value)}
                  options={categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                  placeholder='Select category'
                />
                <FormField
                  className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                  label='Brand (Optional)'
                  value={formState.brand}
                  onChange={(value) => handleFieldChange('brand', value)}
                />
              </div>

              <FormField
                className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                label='Description'
                value={formState.description}
                onChange={(value) => handleFieldChange('description', value)}
                textarea
                placeholder='Describe what makes this product special...'
              />
            </div>

            {/* Step 2: Pricing */}
            <div
              id='step-2'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 2
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <span className=' h-5 w-5 text-black font-semibold'>
                      DT
                    </span>
                  </div>
                  <h2 className='text-xl font-bold text-black'>Pricing</h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Set base product pricing and discount if active
                </p>
              </div>

              <div className='grid gap-5 md:grid-cols-2'>
                <FormField
                  className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                  label='Price'
                  value={formState.price}
                  onChange={(value) => handleFieldChange('price', value)}
                  type='number'
                  placeholder='0.00DT'
                />
                <FormField
                  className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                  label='Discount price'
                  value={formState.discountPrice}
                  onChange={(value) =>
                    handleFieldChange('discountPrice', value)
                  }
                  type='number'
                  placeholder='0.00DT'
                />
              </div>
            </div>

            {/* Step 3: Media */}
            <div
              id='step-3'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 3
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <Image className='h-5 w-5 text-black' />
                  </div>
                  <h2 className='text-xl font-bold text-black'>Media</h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Upload product media assets and manage ordering
                </p>
              </div>

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
                disabled={isSubmitting}
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
                title={
                  formState.images.length > 0 ? 'New Images' : 'Image Preview'
                }
                images={previewUrls}
                onRemove={(index) =>
                  setPendingImages((current) => {
                    URL.revokeObjectURL(current[index].previewUrl);
                    return current.filter((_, i) => i !== index);
                  })
                }
              />
            </div>

            {/* Step 4: Category Placement */}
            <div
              id='step-4'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 4
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <FolderTree className='h-5 w-5 text-black' />
                  </div>
                  <h2 className='text-xl font-bold text-black'>
                    Category Placement
                  </h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Decide where the product fits in primary navigations
                </p>
              </div>
              <label className='flex cursor-pointer items-center gap-3'>
                <button
                  type='button'
                  role='switch'
                  aria-checked={formState.placement}
                  onClick={() =>
                    handleFieldChange('placement', !formState.placement)
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    formState.placement ? 'bg-dark-red' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      formState.placement ? 'translate-x-[22px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
                <span className='text-sm font-medium text-black'>
                  Show on Landing Page
                </span>
              </label>
              <FormField
                className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                label='Collection'
                value={formState.collection}
                onChange={(value) => handleFieldChange('collection', value)}
                placeholder='Add to collection'
              />
            </div>

            {/* Step 5: Product Targeting */}
            <div
              id='step-5'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 5
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <Tag className='h-5 w-5 text-black' />
                  </div>
                  <h2 className='text-xl font-bold text-black'>
                    Product Targeting
                  </h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Assign promotion codes or marketing campaign tags
                </p>
              </div>

              <div className='grid gap-5 md:grid-cols-2'>
                <FormField
                  className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                  label='Promo code'
                  value={formState.promoCode}
                  onChange={(value) => handleFieldChange('promoCode', value)}
                  placeholder='Attach a promo code'
                />
                <FormField
                  className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                  label='Campaign'
                  value={formState.campaign}
                  onChange={(value) => handleFieldChange('campaign', value)}
                  placeholder='eg : ...'
                />
              </div>
            </div>

            {/* Step 6: Product Status */}
            <div
              id='step-6'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 6
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <Eye className='h-5 w-5 text-black' />
                  </div>
                  <h2 className='text-xl font-bold text-black'>
                    Product Status
                  </h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Select whether the product is active or hidden from store
                </p>
              </div>

              <div className='grid gap-5 md:grid-cols-2'>
                <SelectField
                  className='  !bg-[#D9D9D9]/34 border-dark-red !border rounded-lg!'
                  label='Status'
                  value={formState.status}
                  onChange={(value) => handleFieldChange('status', value)}
                  options={[
                    { value: 'active', label: 'Active (Visible on Store)' },
                    { value: 'hidden', label: 'Hidden (Draft/Archived)' },
                  ]}
                />
              </div>
            </div>

            {/* Step 7: Performance Boost */}

            <div
              id='step-7'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 7
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <Zap className='h-5 w-5 text-black' />
                  </div>
                  <h2 className='text-xl font-bold text-black'>
                    Performance Boost
                  </h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Highlight this product with merchandising badges.
                </p>
              </div>
              <div className='flex flex-wrap gap-5'>
                {[
                  { value: 'new arrival', label: 'New Arrival' },
                  { value: 'recommended', label: 'Recommended' },
                  { value: 'featured', label: 'Featured' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => handleFieldChange('performance', value)}
                    className={`min-w-[112px] rounded-full border px-6 py-3 text-[14px] font-semibold leading-none transition-colors ${
                      formState.performance === value
                        ? 'border-[#c79f55] bg-[#c79f55] text-white'
                        : 'border-[#9b7a68] bg-transparent text-black hover:bg-[#efe6dc]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className='rounded-2xl border border-[#b49385] bg-transparent px-4 py-3'>
                <h3 className='text-[15px] font-medium leading-none text-[#241d19]'>
                  Boost in search results
                </h3>
                <p className='mt-2 text-[14px] leading-5 text-[#6f5a4c]'>
                  Prioritize this product in internal search ranking.
                </p>
              </div>
            </div>

            {/* Step 8: Search Engine Optimization (SEO) */}
            <div
              id='step-8'
              className='bg-[#ede7de] rounded-4xl border-[1px] border-dark-red p-6 md:p-5 shadow-sm space-y-6 scroll-mt-6'
            >
              <div className=''>
                <h4 className='text-[#000000]/68 font-bona text-sbase'>
                  Step 8
                </h4>
                <div className='flex  items-center gap-3   '>
                  <div className='bg-[#D9D9D9] px-[7px] py-[5px] rounded-lg '>
                    <Search className='h-5 w-5 text-black' />
                  </div>
                  <h2 className='text-xl font-bold text-black'>
                    Search Engine Optimization (SEO)
                  </h2>
                </div>

                <p className='text-xs text-[#6D5A46] mt-1'>
                  Set search engine slug, meta title and description
                </p>
              </div>

              <div className='!p-0 relative w-full   flex items-center   !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'>
                <span className=' p-2 font-bona text-sm text-[#000000]/68 font-normal border-r border-[#000000]/68 pr-3 h-full !m-0'>
                  store.com/products/
                </span>

                <FormField
                  className=' bg-transparent! !border-0 flex-1 !w-[100%] focus:!ring-0 focus:!border-0 focus:!bg-transparent !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                  label=''
                  value={formState.slug}
                  onChange={(value) => handleFieldChange('slug', value)}
                />
                <button
                  type='button'
                  onClick={() =>
                    handleFieldChange('slug', createSlug(formState.name))
                  }
                  className='absolute -right-3 top-[50%] -translate-[50%] px-3 py-1.5 text-[10px] font-bold text-white bg-[#be9d61] hover:bg-[#be9d61]/90 rounded-full transition-colors shadow-sm'
                >
                  Generate
                </button>
              </div>
              <FormField
                className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                label='Meta title'
                placeholder='Meta title'
                value={formState.metaTitle}
                onChange={(value) => handleFieldChange('metaTitle', value)}
              />

              <FormField
                className=' !mt-0 !border-dark-red !border !rounded-lg !bg-[#D9D9D957]'
                label='Meta description'
                value={formState.metaDescription}
                onChange={(value) =>
                  handleFieldChange('metaDescription', value)
                }
                placeholder='A short compelling summary that appears in search results'
                textarea
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className='flex items-center justify-end border-t border-[#00000020] pt-6'>
              <div className='flex items-center gap-3'>
                <button
                  type='button'
                  onClick={() => handleSubmit('hidden')}
                  disabled={isSubmitting}
                  className='rounded-lg border border-dark-red bg-transparent px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-dark-red/10 shadow-lg'
                >
                  Save as draft
                </button>
                <button
                  type='button'
                  onClick={() => handleSubmit('active')}
                  disabled={isSubmitting}
                  className='rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md'
                >
                  {isSubmitting ? 'Publishing...' : 'Publish product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
