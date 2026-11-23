import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { usersApi } from '@/api/users.api'
import UserAuditLogPanel from '@/pages/users/UserAuditLogPanel'
import { useAuth } from '@/hooks/useAuth'
import { zonesApi } from '@/api/zones.api'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ErrorBanner from '@/components/common/ErrorBanner'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PageHeader from '@/components/common/PageHeader'
import Pagination from '@/components/common/Pagination'
import RoleBadge from '@/components/common/RoleBadge'
import UserAvatar from '@/components/common/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { PaginatedData } from '@/types/api.types'
import type { UserListItem, UserRole } from '@/types/auth.types'
import type { Zone } from '@/types/zone.types'
import { getErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/formatters'
import { logger } from '@/utils/logger'

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-600">{message}</p> : null

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zones: Zone[]
  onCreated: () => void
}

const createUserSchema = (t: (key: string) => string) =>
  z.object({
    full_name: z.string().min(1, t('validation.required')),
    email: z.string().min(1, t('validation.required')).email(t('validation.email')),
    phone: z.string().min(1, t('validation.required')),
    password: z.string().min(8, t('validation.passwordMin')),
    role: z.enum(['admin', 'supervisor', 'helpdesk', 'engineer']),
    zone_ids: z.array(z.number()),
  })

type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>

const CreateUserModal = ({
  open,
  onOpenChange,
  zones,
  onCreated,
}: CreateUserModalProps) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schema = useMemo(() => createUserSchema(t), [t])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'helpdesk',
      zone_ids: [],
    },
  })

  const selectedRole = watch('role')
  const selectedZones = watch('zone_ids')

  useEffect(() => {
    if (open) {
      reset({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'helpdesk',
        zone_ids: [],
      })
      setError(null)
    }
  }, [open, reset])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
    const values = new Uint32Array(12)
    crypto.getRandomValues(values)
    const password = Array.from(
      values,
      (value) => chars[value % chars.length],
    ).join('')
    setValue('password', password, { shouldValidate: true })
  }

  const submit = async (values: CreateUserFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await usersApi.create({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        role: values.role,
        zone_ids: values.role === 'engineer' ? values.zone_ids : undefined,
      })
      logger.info('[USERS] User created.', { role: values.role })
      toast.success(t('users.createdToast'))
      onOpenChange(false)
      onCreated()
    } catch (createError) {
      logger.error('[USERS] Failed to create user.', createError)
      const message = getErrorMessage(createError, t('users.saveFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: t('users.admin') },
    { value: 'supervisor', label: t('users.supervisor') },
    { value: 'helpdesk', label: t('users.helpdesk') },
    { value: 'engineer', label: t('users.engineer') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('users.createUser')}</DialogTitle>
          <DialogDescription>{t('users.createUserDescription')}</DialogDescription>
        </DialogHeader>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-full-name">{t('users.fullName')}</Label>
            <Input
              id="create-full-name"
              placeholder={t('users.fullNamePlaceholder')}
              {...register('full_name')}
            />
            <FieldError message={errors.full_name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-email">{t('users.email')}</Label>
            <Input
              id="create-email"
              type="email"
              placeholder={t('users.emailPlaceholder')}
              {...register('email')}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-phone">{t('users.phone')}</Label>
              <Input
                id="create-phone"
                placeholder={t('users.phonePlaceholder')}
                {...register('phone')}
              />
              <FieldError message={errors.phone?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">{t('users.password')}</Label>
              <div className="flex gap-2">
                <Input
                  id="create-password"
                  placeholder={t('users.passwordPlaceholder')}
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t('users.generatePassword')}
                  onClick={generatePassword}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <FieldError message={errors.password?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('users.role')}</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                        field.value === option.value
                          ? 'border-primary bg-blue-50 text-primary dark:bg-blue-950/40'
                          : 'border-border bg-white text-muted-foreground hover:bg-muted dark:bg-slate-900',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {selectedRole === 'engineer' && (
            <div className="space-y-2">
              <Label>{t('users.assignZones')}</Label>
              {zones.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('users.noZones')}</p>
              ) : (
                <Controller
                  control={control}
                  name="zone_ids"
                  render={({ field }) => (
                    <div className="grid max-h-48 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
                      {zones.map((zone) => {
                        const checked = field.value.includes(zone.id)
                        return (
                          <label
                            key={zone.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border accent-primary"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? field.value.filter((id) => id !== zone.id)
                                  : [...field.value, zone.id]
                                field.onChange(next)
                              }}
                            />
                            {zone.name}
                          </label>
                        )
                      })}
                    </div>
                  )}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {t('users.selectedZones', { count: selectedZones.length })}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('users.creating') : t('users.createUserAction')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditUserModalProps {
  user: UserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

const editUserSchema = (t: (key: string) => string) =>
  z.object({
    full_name: z.string().min(1, t('validation.required')),
    email: z.string().min(1, t('validation.required')).email(t('validation.email')),
    phone: z.string().min(1, t('validation.required')),
  })

type EditUserFormValues = z.infer<ReturnType<typeof editUserSchema>>

const EditUserModal = ({
  user,
  open,
  onOpenChange,
  onUpdated,
}: EditUserModalProps) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schema = useMemo(() => editUserSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', phone: '' },
  })

  useEffect(() => {
    if (open && user) {
      reset({ full_name: user.full_name, email: user.email, phone: user.phone })
      setError(null)
    }
  }, [open, user, reset])

  const submit = async (values: EditUserFormValues) => {
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      await usersApi.update(user.id, {
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
      })
      toast.success(t('users.updatedToast'))
      onOpenChange(false)
      onUpdated()
    } catch (updateError) {
      logger.error('[USERS] Failed to update user.', updateError)
      const message = getErrorMessage(updateError, t('users.saveFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.editUser')}</DialogTitle>
          <DialogDescription>{t('users.editUserDescription')}</DialogDescription>
        </DialogHeader>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-name">{t('users.fullName')}</Label>
            <Input id="edit-user-name" {...register('full_name')} />
            <FieldError message={errors.full_name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-email">{t('users.email')}</Label>
            <Input id="edit-user-email" type="email" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-phone">{t('users.phone')}</Label>
            <Input id="edit-user-phone" {...register('phone')} />
            <FieldError message={errors.phone?.message} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('users.updating') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ResetPasswordModalProps {
  user: UserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const resetPasswordSchema = (t: (key: string) => string) =>
  z.object({
    new_password: z.string().min(8, t('validation.passwordMin')),
  })

type ResetPasswordFormValues = z.infer<ReturnType<typeof resetPasswordSchema>>

const ResetPasswordModal = ({ user, open, onOpenChange }: ResetPasswordModalProps) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const schema = useMemo(() => resetPasswordSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ new_password: '' })
      setError(null)
    }
  }, [open, reset])

  const submit = async (values: ResetPasswordFormValues) => {
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      await usersApi.resetPassword(user.id, { new_password: values.new_password })
      toast.success(t('users.passwordResetToast'))
      onOpenChange(false)
    } catch (resetError) {
      logger.error('[USERS] Failed to reset password.', resetError)
      const message = getErrorMessage(resetError, t('errors.saveFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.resetPassword')}</DialogTitle>
          <DialogDescription>
            {t('users.resetPasswordDescription', { name: user?.full_name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">{t('users.newPassword')}</Label>
            <Input
              id="reset-password"
              placeholder={t('users.passwordPlaceholder')}
              {...register('new_password')}
            />
            <FieldError message={errors.new_password?.message} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('users.resetting') : t('users.resetPassword')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ManageZonesModalProps {
  user: UserListItem | null
  zones: Zone[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

const manageZonesSchema = z.object({
  zone_ids: z.array(z.number()),
})

type ManageZonesFormValues = z.infer<typeof manageZonesSchema>

const ManageZonesModal = ({
  user,
  zones,
  open,
  onOpenChange,
  onUpdated,
}: ManageZonesModalProps) => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<ManageZonesFormValues>({
    resolver: zodResolver(manageZonesSchema),
    defaultValues: { zone_ids: [] },
  })

  useEffect(() => {
    if (open && user) {
      reset({ zone_ids: user.current_zones.map((zone) => zone.id) })
      setError(null)
    }
  }, [open, user, reset])

  const submit = async (values: ManageZonesFormValues) => {
    if (!user) return
    setSubmitting(true)
    setError(null)

    const currentIds = new Set(user.current_zones.map((zone) => zone.id))
    const selectedIds = new Set(values.zone_ids)
    const toAdd = [...selectedIds].filter((id) => !currentIds.has(id))
    const toRemove = [...currentIds].filter((id) => !selectedIds.has(id))

    try {
      for (const zoneId of toAdd) {
        await usersApi.addZone(user.id, { zone_id: zoneId })
      }
      for (const zoneId of toRemove) {
        await usersApi.removeZone(user.id, zoneId)
      }
      logger.info('[USERS] Zones updated.', { userId: user.id })
      toast.success(t('users.zonesUpdatedToast'))
      onOpenChange(false)
      onUpdated()
    } catch (zoneError) {
      logger.error('[USERS] Failed to update zones.', zoneError)
      const message = getErrorMessage(zoneError, t('errors.saveFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.manageZones')}</DialogTitle>
          <DialogDescription>
            {t('users.manageZonesDescription', { name: user?.full_name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('users.noZones')}</p>
          ) : (
            <Controller
              control={control}
              name="zone_ids"
              render={({ field }) => (
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
                  {zones.map((zone) => {
                    const checked = field.value.includes(zone.id)
                    return (
                      <label
                        key={zone.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? field.value.filter((id) => id !== zone.id)
                              : [...field.value, zone.id]
                            field.onChange(next)
                          }}
                        />
                        {zone.name}
                      </label>
                    )
                  })}
                </div>
              )}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.saving') : t('users.saveZones')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const searchSchema = z.object({
  search: z.string(),
})

type SearchFormValues = z.infer<typeof searchSchema>

const UsersPage = () => {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [roleFilters, setRoleFilters] = useState<UserRole[]>(
    () => searchParams.getAll('role') as UserRole[],
  )
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get('page') ?? '1') || 1),
  )
  const searchInitialized = useRef(false)
  const [data, setData] = useState<PaginatedData<UserListItem> | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserListItem | null>(null)
  const [resetUser, setResetUser] = useState<UserListItem | null>(null)
  const [zonesUser, setZonesUser] = useState<UserListItem | null>(null)
  const [statusTarget, setStatusTarget] = useState<UserListItem | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const { register, handleSubmit, watch } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search: searchParams.get('search') ?? '' },
  })
  const searchInput = watch('search')

  const updateUrl = (
    roles: UserRole[],
    searchValue: string,
    pageNumber: number,
  ) => {
    const params = new URLSearchParams()
    roles.forEach((role) => params.append('role', role))
    if (searchValue.trim()) params.set('search', searchValue.trim())
    if (pageNumber > 1) params.set('page', String(pageNumber))
    setSearchParams(params, { replace: true })
  }

  useEffect(() => {
    if (!searchInitialized.current) {
      searchInitialized.current = true
      return
    }
    const timer = setTimeout(() => {
      const term = searchInput.trim()
      setSearch(term)
      setPage(1)
      updateUrl(roleFilters, term, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await zonesApi.list()
        setZones(response.data ?? [])
      } catch (zoneError) {
        logger.error('[USERS] Failed to load zones.', zoneError)
      }
    }
    void loadZones()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    logger.info('[USERS] Loading users.', { roleFilters, page })

    try {
      const response = await usersApi.list({
        role: roleFilters.length > 0 ? roleFilters : undefined,
        search: search || undefined,
        page,
        page_size: 20,
      })
      setData(response.data)
    } catch (loadError) {
      logger.error('[USERS] Failed to load users.', loadError)
      setError(getErrorMessage(loadError, t('users.loadFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [roleFilters, search, page])

  const submitSearch = (values: SearchFormValues) => {
    const term = values.search.trim()
    setSearch(term)
    setPage(1)
    updateUrl(roleFilters, term, 1)
  }

  const toggleRole = (role: UserRole) => {
    const nextRoles = roleFilters.includes(role)
      ? roleFilters.filter((item) => item !== role)
      : [...roleFilters, role]
    setRoleFilters(nextRoles)
    setPage(1)
    updateUrl(nextRoles, search, 1)
  }

  const clearRoles = () => {
    setRoleFilters([])
    setPage(1)
    updateUrl([], search, 1)
  }

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    updateUrl(roleFilters, search, nextPage)
  }

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: t('users.admins') },
    { value: 'supervisor', label: t('users.supervisor') },
    { value: 'helpdesk', label: t('users.helpDesk') },
    { value: 'engineer', label: t('users.engineers') },
  ]

  const confirmStatusChange = async () => {
    if (!statusTarget) return
    setStatusLoading(true)
    try {
      if (statusTarget.is_active) {
        await usersApi.disable(statusTarget.id)
        toast.success(t('users.disabledToast'))
      } else {
        await usersApi.enable(statusTarget.id)
        toast.success(t('users.enabledToast'))
      }
      setStatusTarget(null)
      await loadUsers()
    } catch (statusError) {
      logger.error('[USERS] Failed to change account status.', statusError)
      toast.error(getErrorMessage(statusError, t('errors.actionFailed')))
    } finally {
      setStatusLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await usersApi.deleteUser(deleteTarget.id)
      toast.success(t('users.deletedToast'))
      setDeleteTarget(null)
      await loadUsers()
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, t('users.deleteFailed')))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <PageHeader

        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('users.createUser')}
          </Button>
        }
      />

      <div className="mb-4 inline-flex rounded-lg border border-border bg-white p-1 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium',
            activeTab === 'users'
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {t('users.usersTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium',
            activeTab === 'audit'
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {t('users.auditTab')}
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={clearRoles}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              roleFilters.length === 0
                ? 'bg-primary text-white'
                : 'bg-white text-muted-foreground hover:bg-muted dark:bg-slate-900',
            )}
          >
            {t('users.allRoles')}
          </button>
          {roleOptions.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => toggleRole(tab.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                roleFilters.includes(tab.value)
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted-foreground hover:bg-muted dark:bg-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(submitSearch)} className="flex w-full gap-2 lg:w-80">
          <Input
            placeholder={t('filters.searchUsers')}
            {...register('search')}
          />
          <Button type="submit" variant="outline" size="icon" aria-label={t('common.search')}>
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void loadUsers()} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-white dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.user')}</TableHead>
                  <TableHead>{t('users.email')}</TableHead>
                  <TableHead>{t('users.role')}</TableHead>
                  <TableHead>{t('users.zones')}</TableHead>
                  <TableHead>{t('users.status')}</TableHead>
                  <TableHead>{t('users.created')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.results ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar id={user.id} fullName={user.full_name} />
                        <div>
                          <p className="text-sm font-medium">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-56 flex-wrap gap-1">
                        {user.current_zones.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {t('common.none')}
                          </span>
                        ) : (
                          user.current_zones.map((zone) => (
                            <span
                              key={zone.id}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {zone.name}
                            </span>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'rounded',
                          user.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {user.is_active ? t('users.active') : t('users.disabled')}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t('common.actions')}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={() => setEditUser(user)}
                          >
                            {t('users.editDetails')}
                          </DropdownMenuItem>
                          {user.role !== 'admin' && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={() => setResetUser(user)}
                            >
                              {t('users.resetPassword')}
                            </DropdownMenuItem>
                          )}
                          {user.role === 'engineer' && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={() => setZonesUser(user)}
                            >
                              {t('users.manageZones')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {currentUser?.id !== user.id && (
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600"
                              onSelect={() => setDeleteTarget(user)}
                            >
                              {t('users.deleteUser')}
                            </DropdownMenuItem>
                          )}
                          {user.is_active ? (
                            currentUser?.id !== user.id && (
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                onSelect={() => setStatusTarget(user)}
                              >
                                {t('users.disableAccount')}
                              </DropdownMenuItem>
                            )
                          ) : (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={() => setStatusTarget(user)}
                            >
                              {t('users.enableAccount')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(data?.results.length ?? 0) === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">{t('users.noUsers')}</p>
          )}

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              count={data.count}
              pageSize={data.page_size}
              onPageChange={changePage}
            />
          )}
        </>
      )}

        </>
      ) : (
        <UserAuditLogPanel />
      )}

      <CreateUserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        zones={zones}
        onCreated={() => void loadUsers()}
      />
      <EditUserModal
        user={editUser}
        open={editUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditUser(null)
        }}
        onUpdated={() => void loadUsers()}
      />
      <ResetPasswordModal
        user={resetUser}
        open={resetUser !== null}
        onOpenChange={(open) => {
          if (!open) setResetUser(null)
        }}
      />
      <ManageZonesModal
        user={zonesUser}
        zones={zones}
        open={zonesUser !== null}
        onOpenChange={(open) => {
          if (!open) setZonesUser(null)
        }}
        onUpdated={() => void loadUsers()}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null)
        }}
        title={
          statusTarget?.is_active ? t('users.disableTitle') : t('users.enableTitle')
        }
        description={
          statusTarget?.is_active
            ? t('users.disableDescription', { name: statusTarget.full_name })
            : t('users.enableDescription', {
                name: statusTarget?.full_name ?? '',
              })
        }
        confirmLabel={
          statusTarget?.is_active ? t('users.disableAccount') : t('users.enableAccount')
        }
        onConfirm={() => void confirmStatusChange()}
        destructive={statusTarget?.is_active}
        loading={statusLoading}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t('users.deleteTitle')}
        description={t('users.deleteDescription', {
          name: deleteTarget?.full_name ?? '',
        })}
        confirmLabel={t('users.deleteUser')}
        onConfirm={() => void confirmDelete()}
        destructive
        loading={deleteLoading}
      />
    </div>
  )
}

export default UsersPage
