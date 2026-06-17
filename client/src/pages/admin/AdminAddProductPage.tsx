import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  DollarSign,
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
    value: string | string[],
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
      primaryPlacement: formState.primaryPlacement || undefined,
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

  const steps = [
    { id: 1, name: 'Basic Information', icon: FileText },
    { id: 2, name: 'Pricing', icon: DollarSign },
    { id: 3, name: 'Media', icon: Image },
    { id: 4, name: 'Category Placement', icon: FolderTree },
    { id: 5, name: 'Product Targeting', icon: Tag },
    { id: 6, name: 'Product Status', icon: Eye },
    { id: 7, name: 'Performance Boost', icon: Zap },
    { id: 8, name: 'Search Engine Optimization (SEO)', icon: Search },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AdminLayout>
      <div className='min-h-screen bg-[#F7EEE1] p-4 md:p-8 font-bona!'>
        <div className='mx-auto max-w-6xl'>
          {/* Header */}
          <div className='flex flex-wrap items-center justify-between gap-4 border-b border-[#00000020] pb-5 mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-[#3f060f]'>Add Product</h1>
              <p className='text-sm text-[#6D5A46] mt-1'>
                Create a new product with pricing, media, visibility and SEO
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => navigate('/admin/analytics')}
                className='rounded-full border border-[#6D5A46] bg-white px-5 py-2 text-sm font-semibold text-[#6D5A46] transition-all hover:bg-[#F7EEE1]'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={() => handleSubmit('hidden')}
                disabled={isSubmitting}
                className='rounded-full border border-[#3f060f] bg-transparent px-5 py-2 text-sm font-semibold text-[#3f060f] transition-all hover:bg-[#3f060f]/10'
              >
                Save as draft
              </button>
              <button
                type='button'
                onClick={() => handleSubmit('active')}
                disabled={isSubmitting}
                className='rounded-full bg-[#3f060f] px-6 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md'
              >
                {isSubmitting ? 'Publishing...' : 'Publish product'}
              </button>
            </div>
          </div>

          {/* Core Layout */}
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8 items-start'>
            {/* Sidebar Navigation */}
            <div className='lg:col-span-1 lg:sticky lg:top-6'>
              <div className='bg-white/70 backdrop-blur-md border border-[#d5bd9d]/30 rounded-3xl p-5 space-y-2 shadow-sm'>
                <h3 className='text-xs font-bold text-[#6D5A46] uppercase tracking-wider mb-4 px-2'>
                  Product Setup Steps
                </h3>
                <nav className='space-y-1.5'>
                  {steps.map((step) => {
                    const StepIcon = step.icon;
                    return (
                      <button
                        key={step.id}
                        type='button'
                        onClick={() => scrollToSection(`step-${step.id}`)}
                        className='w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#6D5A46] hover:bg-[#FCECD8]/60 hover:text-[#3f060f] transition-all'
                      >
                        <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#F7EEE1] text-[10px] font-bold text-[#6D5A46]'>
                          {step.id}
                        </div>
                        <StepIcon className='w-4 h-4 shrink-0' />
                        <span className='truncate'>{step.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Form Fields container */}
            <div className='lg:col-span-3 space-y-6'>
              {/* Step 1: Basic Information */}
              <div
                id='step-1'
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <FileText className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 1: Basic Information
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Enter product name, category, brand, and description
                    </p>
                  </div>
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <FormField
                    label='Product name'
                    value={formState.name}
                    onChange={(value) => handleFieldChange('name', value)}
                  />
                  <FormField
                    label='Brand'
                    value={formState.brand}
                    onChange={(value) => handleFieldChange('brand', value)}
                  />
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <SelectField
                    label='Category'
                    value={formState.categoryId}
                    onChange={(value) => handleFieldChange('categoryId', value)}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                  />
                </div>

                <FormField
                  label='Description'
                  value={formState.description}
                  onChange={(value) => handleFieldChange('description', value)}
                  textarea
                />
              </div>

              {/* Step 2: Pricing */}
              <div
                id='step-2'
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <DollarSign className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 2: Pricing
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Set base product pricing and discount if active
                    </p>
                  </div>
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <FormField
                    label='Price'
                    value={formState.price}
                    onChange={(value) => handleFieldChange('price', value)}
                    type='number'
                  />
                  <FormField
                    label='Discount price'
                    value={formState.discountPrice}
                    onChange={(value) =>
                      handleFieldChange('discountPrice', value)
                    }
                    type='number'
                  />
                </div>
              </div>

              {/* Step 3: Media */}
              <div
                id='step-3'
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <Image className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 3: Media
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Upload product media assets and manage ordering
                    </p>
                  </div>
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
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <FolderTree className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 4: Category Placement
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Decide where the product fits in primary navigations
                    </p>
                  </div>
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <SelectField
                    label='Primary Placement'
                    value={formState.primaryPlacement}
                    onChange={(value) =>
                      handleFieldChange('primaryPlacement', value)
                    }
                    options={['Homepage', 'Collection', 'Featured'].map(
                      (item) => ({
                        value: item,
                        label: item,
                      }),
                    )}
                  />
                  <FormField
                    label='Collection'
                    value={formState.collection}
                    onChange={(value) => handleFieldChange('collection', value)}
                  />
                </div>
              </div>

              {/* Step 5: Product Targeting */}
              <div
                id='step-5'
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <Tag className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 5: Product Targeting
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Assign promotion codes or marketing campaign tags
                    </p>
                  </div>
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <FormField
                    label='Promo code'
                    value={formState.promoCode}
                    onChange={(value) => handleFieldChange('promoCode', value)}
                  />
                  <FormField
                    label='Campaign'
                    value={formState.campaign}
                    onChange={(value) => handleFieldChange('campaign', value)}
                  />
                </div>
              </div>

              {/* Step 6: Product Status */}
              <div
                id='step-6'
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <Eye className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 6: Product Status
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Select whether the product is active or hidden from store
                    </p>
                  </div>
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <SelectField
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
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <Zap className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 7: Performance Boost
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Choose promotion boost category for items
                    </p>
                  </div>
                </div>

                <div>
                  <span className='mb-2.5 block text-xs font-bold text-[#6D5A46] uppercase tracking-wide'>
                    Performance Category
                  </span>
                  <div className='flex gap-2 p-1.5 bg-[#F7EEE1] rounded-2xl border border-[#d5bd9d]/30'>
                    {['new arrival', 'recommended', 'featured'].map((perf) => (
                      <button
                        key={perf}
                        type='button'
                        onClick={() => handleFieldChange('performance', perf)}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl capitalize transition-all duration-200 ${
                          formState.performance === perf
                            ? 'bg-[#3f060f] text-white shadow-sm'
                            : 'text-[#6D5A46] hover:bg-[#FCECD8]/40 hover:text-[#3f060f]'
                        }`}
                      >
                        {perf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 8: Search Engine Optimization (SEO) */}
              <div
                id='step-8'
                className='bg-white rounded-3xl border border-[#d5bd9d]/30 p-6 md:p-8 shadow-sm space-y-6 scroll-mt-6'
              >
                <div className='flex items-center gap-3 border-b border-gray-100 pb-4'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCECD8] text-[#3f060f] shadow-inner'>
                    <Search className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base font-bold text-[#3f060f]'>
                      Step 8: Search Engine Optimization (SEO)
                    </h2>
                    <p className='text-[11px] text-[#6D5A46]'>
                      Set search engine slug, meta title and description
                    </p>
                  </div>
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <div className='relative'>
                    <FormField
                      label='Slug'
                      value={formState.slug}
                      onChange={(value) => handleFieldChange('slug', value)}
                    />
                    <button
                      type='button'
                      onClick={() =>
                        handleFieldChange('slug', createSlug(formState.name))
                      }
                      className='absolute right-2.5 top-[34px] px-3 py-1.5 text-[10px] font-bold text-white bg-[#be9d61] hover:bg-[#be9d61]/90 rounded-full transition-colors shadow-sm'
                    >
                      Generate
                    </button>
                  </div>
                  <FormField
                    label='Meta title'
                    value={formState.metaTitle}
                    onChange={(value) => handleFieldChange('metaTitle', value)}
                  />
                </div>

                <FormField
                  label='Meta description'
                  value={formState.metaDescription}
                  onChange={(value) =>
                    handleFieldChange('metaDescription', value)
                  }
                  textarea
                />
              </div>

              {/* Bottom Actions Bar */}
              <div className='flex items-center justify-between border-t border-[#00000020] pt-6'>
                <button
                  type='button'
                  onClick={() => navigate('/admin/analytics')}
                  className='rounded-full border border-[#6D5A46] bg-white px-5 py-2 text-sm font-semibold text-[#6D5A46] transition-all hover:bg-[#F7EEE1]'
                >
                  Cancel
                </button>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => handleSubmit('hidden')}
                    disabled={isSubmitting}
                    className='rounded-full border border-[#3f060f] bg-transparent px-5 py-2 text-sm font-semibold text-[#3f060f] transition-all hover:bg-[#3f060f]/10'
                  >
                    Save as draft
                  </button>
                  <button
                    type='button'
                    onClick={() => handleSubmit('active')}
                    disabled={isSubmitting}
                    className='rounded-full bg-[#3f060f] px-6 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md'
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
