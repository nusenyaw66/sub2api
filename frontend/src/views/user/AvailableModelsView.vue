<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ t('availableModels.title') }}
        </h2>
        <div class="relative w-full sm:w-80">
          <Icon
            name="search"
            size="md"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('availableModels.searchPlaceholder')"
            class="input pl-10"
          />
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
      <div v-else-if="error" class="card p-6 text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </div>
      <div v-else-if="filteredModels.length === 0" class="card p-10 text-center text-sm text-gray-500 dark:text-dark-400">
        {{ models.length === 0 ? t('availableModels.empty') : t('availableModels.noResults') }}
      </div>
      <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article
          v-for="model in filteredModels"
          :key="modelKey(model)"
          class="card p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate font-semibold text-gray-900 dark:text-white">{{ model.name }}</h3>
              <p v-if="model.group_name" class="mt-1 text-xs text-gray-500 dark:text-dark-400">
                {{ t('availableModels.group', { name: model.group_name }) }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-icon shrink-0"
              :title="copiedKey === modelKey(model) ? t('availableModels.copied') : t('availableModels.copy')"
              :aria-label="t('availableModels.copy')"
              @click="copyName(model)"
            >
              <Icon name="copy" size="sm" />
            </button>
          </div>
          <div class="mt-4 flex items-start gap-3">
            <PlatformIcon
              v-if="model.platform"
              :platform="model.platform as GroupPlatform"
              size="md"
              :class="platformIconClass(model.platform)"
            />
            <ul class="min-w-0 space-y-1 text-sm text-gray-600 dark:text-dark-300">
              <li v-for="line in priceLines(model)" :key="line">{{ line }}</li>
            </ul>
          </div>
          <span class="mt-4 inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {{ billingLabel(model.billing_mode) }}
          </span>
        </article>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import { listAvailableModels, type AvailableModelCard } from '@/api/availableModels'
import { BILLING_MODE_IMAGE, BILLING_MODE_PER_REQUEST, BILLING_MODE_VIDEO } from '@/constants/channel'
import { formatScaled } from '@/utils/pricing'
import { platformIconClass } from '@/utils/platformColors'
import { extractApiErrorMessage } from '@/utils/apiError'
import type { GroupPlatform } from '@/types'

const { t } = useI18n()
const models = ref<AvailableModelCard[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const copiedKey = ref('')

const filteredModels = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return models.value
  return models.value.filter((model) => model.name.toLowerCase().includes(query))
})

function modelKey(model: AvailableModelCard): string {
  return `${model.name}:${model.group_name ?? ''}:${model.billing_mode}`
}

function perMillion(value: number | null): string {
  return formatScaled(value, 1_000_000, 4)
}

function priceLines(model: AvailableModelCard): string[] {
  if (model.billing_mode === BILLING_MODE_PER_REQUEST || model.billing_mode === BILLING_MODE_IMAGE || model.billing_mode === BILLING_MODE_VIDEO) {
    if (model.per_request_price == null) return []
    return [t('availableModels.requestPrice', { price: formatScaled(model.per_request_price, 1, 4) })]
  }
  const lines: string[] = []
  if (model.input_price != null) lines.push(t('availableModels.inputPrice', { price: perMillion(model.input_price) }))
  if (model.output_price != null) lines.push(t('availableModels.outputPrice', { price: perMillion(model.output_price) }))
  if (model.cache_write_price != null) lines.push(t('availableModels.cacheWritePrice', { price: perMillion(model.cache_write_price) }))
  if (model.cache_read_price != null) lines.push(t('availableModels.cacheReadPrice', { price: perMillion(model.cache_read_price) }))
  return lines
}

function billingLabel(mode: string): string {
  if (mode === BILLING_MODE_PER_REQUEST) return t('availableModels.perRequest')
  if (mode === BILLING_MODE_IMAGE) return t('availableModels.perImage')
  if (mode === BILLING_MODE_VIDEO) return t('availableModels.perVideo')
  return t('availableModels.payAsYouGo')
}

async function copyName(model: AvailableModelCard) {
  try {
    await navigator.clipboard.writeText(model.name)
    copiedKey.value = modelKey(model)
  } catch (copyError) {
    console.error('Failed to copy model name:', copyError)
  }
}

async function loadModels() {
  loading.value = true
  error.value = ''
  try {
    models.value = await listAvailableModels()
  } catch (loadError) {
    error.value = extractApiErrorMessage(loadError, t('availableModels.loadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadModels()
})
</script>
