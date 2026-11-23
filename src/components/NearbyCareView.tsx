import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Check,
  Clock,
  ExternalLink,
  LocateFixed,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

type CareCategory = 'all' | 'pharmacy' | 'clinic' | 'hospital';

interface NearbyCarePlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  category: Exclude<CareCategory, 'all'>;
  primaryTypeLabel: string;
  location: google.maps.LatLngLiteral;
  distanceMeters: number | null;
  isOpen: boolean | null;
  todayHoursText: string | null;
  nationalPhoneNumber: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsURI: string | null;
  wheelchairAccessible: boolean;
  attributions: Array<{ provider: string; providerURI: string | null }>;
}

interface AutocompleteItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Default initial map center (San Francisco civic area) until user enters an address or opts into geolocation
const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 37.7749,
  lng: -122.4194,
};

const CATEGORY_TYPES: Record<CareCategory, string[]> = {
  all: [
    'pharmacy',
    'drugstore',
    'medical_clinic',
    'doctor',
    'hospital',
    'general_hospital',
  ],
  pharmacy: ['pharmacy', 'drugstore'],
  clinic: ['medical_clinic', 'doctor', 'medical_center'],
  hospital: ['hospital', 'general_hospital'],
};

const RADIUS_METERS: [number, number, number] = [3219, 8047, 16093];

const CATEGORY_STYLES: Record<
  Exclude<CareCategory, 'all'>,
  {
    glyph: string;
    pinBg: string;
    pinBorder: string;
    textClass: string;
  }
> = {
  pharmacy: {
    glyph: 'Rx',
    pinBg: '#0E6B5E',
    pinBorder: '#08473E',
    textClass: 'text-[#0E6B5E]',
  },
  clinic: {
    glyph: 'C',
    pinBg: '#1D4ED8',
    pinBorder: '#1E3A8A',
    textClass: 'text-[#1D4ED8]',
  },
  hospital: {
    glyph: 'H',
    pinBg: '#B91C1C',
    pinBorder: '#7F1D1D',
    textClass: 'text-[#B91C1C]',
  },
};

function classifyPlaceCategory(
  primaryType: string | null | undefined,
  types: string[] | null | undefined
): Exclude<CareCategory, 'all'> {
  const allTypes = [primaryType ?? '', ...(types ?? [])].map((t) =>
    t.toLowerCase()
  );
  if (
    allTypes.includes('hospital') ||
    allTypes.includes('general_hospital')
  ) {
    return 'hospital';
  }
  if (allTypes.includes('pharmacy') || allTypes.includes('drugstore')) {
    return 'pharmacy';
  }
  return 'clinic';
}

function isQuotaError(err: unknown): boolean {
  const msg = String(
    err instanceof Error ? err.message : err ?? ''
  ).toUpperCase();
  const status = String(
    (err as { status?: string; code?: string | number } | null)?.status ??
      (err as { code?: string | number } | null)?.code ??
      ''
  ).toUpperCase();
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('QUOTA') ||
    status === '429' ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 'OVER_QUERY_LIMIT'
  );
}

function extractTodayHours(
  openingHours: google.maps.places.OpeningHours | null | undefined
): string | null {
  const descriptions = openingHours?.weekdayDescriptions;
  if (!descriptions || descriptions.length === 0) return null;
  // JS getDay(): 0 = Sun, 1 = Mon ... 6 = Sat; Google weekdayDescriptions starts on Monday (index 0)
  const jsDay = new Date().getDay();
  const googleIdx = jsDay === 0 ? 6 : jsDay - 1;
  return descriptions[googleIdx] ?? descriptions[0] ?? null;
}

interface CareMarkerProps {
  place: NearbyCarePlace;
  categoryLabel: string;
  isSelected: boolean;
  isSavedPharmacy: boolean;
  onSelect: (place: NearbyCarePlace) => void;
  onClose: () => void;
  onSavePharmacy?: (name: string, phone: string) => void;
}

function CareMarker({
  place,
  categoryLabel,
  isSelected,
  isSavedPharmacy,
  onSelect,
  onClose,
  onSavePharmacy,
}: CareMarkerProps) {
  const { t, isRTL, formatDistance } = useLanguage();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const visual = CATEGORY_STYLES[place.category];
  const distanceLabel = formatDistance(place.distanceMeters);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={`${place.displayName} (${categoryLabel})`}
        onClick={() => onSelect(place)}
        zIndex={isSelected ? 20 : 1}
      >
        <Pin
          background={visual.pinBg}
          borderColor={visual.pinBorder}
          glyphColor="#FFFFFF"
          glyphText={visual.glyph}
          scale={isSelected ? 1.25 : 1.05}
        />
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={300}
          onCloseClick={onClose}
        >
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="p-1 space-y-2 text-[#111C2D] text-start"
          >
            <div>
              <p className={`text-xs font-bold ${visual.textClass}`}>
                {categoryLabel}
                {distanceLabel ? (
                  <>
                    {' · '}
                    <span dir="ltr" className="inline-block">
                      {distanceLabel}
                    </span>
                  </>
                ) : null}
              </p>
              <p className="font-display font-bold text-base leading-snug mt-0.5">
                {place.displayName}
              </p>
            </div>

            {place.formattedAddress && (
              <p className="text-xs text-[#475569] leading-relaxed">
                {place.formattedAddress}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {place.isOpen !== null && (
                <span
                  className={
                    place.isOpen
                      ? 'font-semibold text-[#0E6B5E]'
                      : 'font-semibold text-[#B91C1C]'
                  }
                >
                  {place.isOpen ? t.nearby.openNow : t.nearby.closedNow}
                </span>
              )}
              {place.rating !== null && (
                <span dir="ltr" className="text-[#475569] tabular-nums inline-block">
                  · {place.rating.toFixed(1)} ({place.userRatingCount ?? 0})
                </span>
              )}
            </div>

            {place.nationalPhoneNumber && (
              <a
                href={`tel:${place.nationalPhoneNumber.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6B5E] hover:underline"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span dir="ltr">{place.nationalPhoneNumber}</span>
              </a>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {place.googleMapsURI && (
                <a
                  href={place.googleMapsURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111C2D] text-white text-xs font-semibold hover:bg-[#1E293B]"
                >
                  <span>{t.nearby.directions}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {place.category === 'pharmacy' && onSavePharmacy && (
                <button
                  type="button"
                  onClick={() =>
                    onSavePharmacy(
                      place.displayName,
                      place.nationalPhoneNumber || ''
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0E6B5E]/10 text-[#0E6B5E] text-xs font-semibold hover:bg-[#0E6B5E]/20 cursor-pointer"
                >
                  {isSavedPharmacy ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>{t.nearby.savedPharmacy}</span>
                    </>
                  ) : (
                    <span>{t.nearby.saveAsMyPharmacy}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

type LocationLabelMode =
  | { kind: 'default' }
  | { kind: 'current' }
  | { kind: 'mapArea' }
  | { kind: 'custom'; text: string };

interface NearbyCareWorkspaceProps {
  savedPharmacyName: string;
  onSavePharmacy: (name: string, phone: string) => void;
}

function NearbyCareWorkspace({
  savedPharmacyName,
  onSavePharmacy,
}: NearbyCareWorkspaceProps) {
  const { language, meta, t, formatDistance } = useLanguage();
  const map = useMap('steadydose-nearby-map');
  const placesLibrary = useMapsLibrary('places');
  const geometryLibrary = useMapsLibrary('geometry');

  const [searchCenter, setSearchCenter] =
    useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [locationLabelMode, setLocationLabelMode] = useState<LocationLabelMode>({
    kind: 'default',
  });
  const [category, setCategory] = useState<CareCategory>('all');
  const [radiusMeters, setRadiusMeters] = useState<number>(RADIUS_METERS[1]);
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);

  const [places, setPlaces] = useState<NearbyCarePlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [mapPanned, setMapPanned] = useState<boolean>(false);

  // Programmatic Autocomplete state (modern AutocompleteSuggestion + AutocompleteSessionToken)
  const [addressQuery, setAddressQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const searchRequestCounterRef = useRef<number>(0);

  const categoryLabels: Record<Exclude<CareCategory, 'all'>, string> = useMemo(
    () => ({
      pharmacy: t.nearby.labelPharmacy,
      clinic: t.nearby.labelClinic,
      hospital: t.nearby.labelHospital,
    }),
    [t.nearby.labelPharmacy, t.nearby.labelClinic, t.nearby.labelHospital]
  );

  const categoryOptions: Array<{ id: CareCategory; label: string }> = useMemo(
    () => [
      { id: 'all', label: t.nearby.catAll },
      { id: 'pharmacy', label: t.nearby.catPharmacies },
      { id: 'clinic', label: t.nearby.catClinics },
      { id: 'hospital', label: t.nearby.catHospitals },
    ],
    [
      t.nearby.catAll,
      t.nearby.catPharmacies,
      t.nearby.catClinics,
      t.nearby.catHospitals,
    ]
  );

  const radiusOptions = useMemo(
    () =>
      RADIUS_METERS.map((meters, idx) => ({
        meters,
        label: t.nearby.radiusLabels[idx],
      })),
    [t.nearby.radiusLabels]
  );

  const locationLabel =
    locationLabelMode.kind === 'default'
      ? t.nearby.defaultArea
      : locationLabelMode.kind === 'current'
        ? t.nearby.yourCurrentLocation
        : locationLabelMode.kind === 'mapArea'
          ? t.nearby.currentMapArea
          : locationLabelMode.text;

  // Fetch nearby places using modern Places API (New): Place.searchNearby
  const runNearbySearch = useCallback(
    async (
      center: google.maps.LatLngLiteral,
      activeCategory: CareCategory,
      radius: number
    ) => {
      if (!placesLibrary) return;

      const reqId = ++searchRequestCounterRef.current;
      setIsSearching(true);
      setSearchError(null);
      setMapPanned(false);

      const categoryTypes = CATEGORY_TYPES[activeCategory] ?? CATEGORY_TYPES.all;

      // Clamp radius strictly to Places API (New) 50,000m maximum
      const clampedRadius = Math.min(Math.max(radius, 500), 50000);

      try {
        const request: google.maps.places.SearchNearbyRequest & {
          internalUsageAttributionIds?: string[];
        } = {
          fields: [
            'id',
            'displayName',
            'location',
            'formattedAddress',
            'primaryType',
            'primaryTypeDisplayName',
            'types',
            'businessStatus',
            'googleMapsURI',
            'regularOpeningHours',
            'utcOffsetMinutes',
            'nationalPhoneNumber',
            'rating',
            'userRatingCount',
            'accessibilityOptions',
          ],
          locationRestriction: {
            center,
            radius: clampedRadius,
          },
          includedPrimaryTypes: categoryTypes,
          maxResultCount: 15,
          rankPreference: placesLibrary.SearchNearbyRankPreference.DISTANCE,
          language: meta.mapsLanguage,
          region: meta.mapsRegion,
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        };

        const response = await placesLibrary.Place.searchNearby(request);
        if (reqId !== searchRequestCounterRef.current) return;

        const rawPlaces = response?.places ?? [];
        const mapped = await Promise.all(
          rawPlaces
            .filter((p) => Boolean(p?.location))
            .map(async (p): Promise<NearbyCarePlace> => {
              const loc = p.location!;
              const pos: google.maps.LatLngLiteral = {
                lat: typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat),
                lng: typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng),
              };

              let distanceMeters: number | null = null;
              if (geometryLibrary?.spherical) {
                try {
                  distanceMeters =
                    geometryLibrary.spherical.computeDistanceBetween(
                      center,
                      pos
                    );
                } catch {
                  distanceMeters = null;
                }
              }

              let isOpenValue: boolean | null = null;
              try {
                const openRes = await p.isOpen();
                if (typeof openRes === 'boolean') {
                  isOpenValue = openRes;
                }
              } catch {
                isOpenValue = null;
              }

              const resolvedCategory = classifyPlaceCategory(
                p.primaryType,
                p.types
              );

              return {
                id: p.id || `${pos.lat},${pos.lng}`,
                displayName: p.displayName || t.nearby.healthcareFacility,
                formattedAddress: p.formattedAddress || '',
                category: resolvedCategory,
                primaryTypeLabel:
                  p.primaryTypeDisplayName || categoryLabels[resolvedCategory],
                location: pos,
                distanceMeters,
                isOpen: isOpenValue,
                todayHoursText: extractTodayHours(p.regularOpeningHours),
                nationalPhoneNumber: p.nationalPhoneNumber || null,
                rating: typeof p.rating === 'number' ? p.rating : null,
                userRatingCount:
                  typeof p.userRatingCount === 'number'
                    ? p.userRatingCount
                    : null,
                googleMapsURI: p.googleMapsURI || null,
                wheelchairAccessible: Boolean(
                  p.accessibilityOptions?.hasWheelchairAccessibleEntrance
                ),
                attributions: (p.attributions ?? []).map((a) => ({
                  provider: a.provider || '',
                  providerURI: a.providerURI || null,
                })),
              };
            })
        );

        if (reqId !== searchRequestCounterRef.current) return;

        mapped.sort(
          (a, b) =>
            (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
            (b.distanceMeters ?? Number.MAX_SAFE_INTEGER)
        );
        setPlaces(mapped);
        setSelectedPlaceId(null);
      } catch (err) {
        if (reqId !== searchRequestCounterRef.current) return;
        console.error('Nearby healthcare search error:', err);
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          setSearchError(t.nearby.errQuota);
        } else {
          setSearchError(t.nearby.errLoad);
        }
        setPlaces([]);
      } finally {
        if (reqId === searchRequestCounterRef.current) {
          setIsSearching(false);
        }
      }
    },
    [
      placesLibrary,
      geometryLibrary,
      meta.mapsLanguage,
      meta.mapsRegion,
      t.nearby.healthcareFacility,
      t.nearby.errQuota,
      t.nearby.errLoad,
      categoryLabels,
    ]
  );

  // Trigger nearby search when Places library is ready, filters/center change, or language changes
  useEffect(() => {
    if (!placesLibrary) return;
    void runNearbySearch(searchCenter, category, radiusMeters);
  }, [
    placesLibrary,
    searchCenter,
    category,
    radiusMeters,
    language,
    runNearbySearch,
  ]);

  // Debounced address autocomplete using AutocompleteSuggestion + AutocompleteSessionToken
  useEffect(() => {
    if (!placesLibrary) return;
    const trimmed = addressQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current =
            new placesLibrary.AutocompleteSessionToken();
        }
        const res =
          await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: trimmed,
              sessionToken: sessionTokenRef.current,
              language: meta.mapsLanguage,
              region: meta.mapsRegion,
            }
          );

        const items: AutocompleteItem[] = (res?.suggestions ?? [])
          .filter((s) => Boolean(s.placePrediction))
          .slice(0, 5)
          .map((s) => {
            const pred = s.placePrediction!;
            return {
              placeId: pred.placeId,
              mainText: pred.mainText?.text || pred.text?.text || '',
              secondaryText: pred.secondaryText?.text || '',
              prediction: pred,
            };
          });
        setSuggestions(items);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Address autocomplete error:', err);
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [addressQuery, placesLibrary, meta.mapsLanguage, meta.mapsRegion]);

  const handleSelectSuggestion = async (item: AutocompleteItem) => {
    setShowSuggestions(false);
    setAddressQuery(
      item.secondaryText
        ? `${item.mainText}, ${item.secondaryText}`
        : item.mainText
    );
    setSuggestions([]);
    setLocationMessage(null);

    try {
      const place = item.prediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'formattedAddress', 'displayName'],
      });
      // Reset session token after completing the Places Details fetch
      sessionTokenRef.current = null;

      if (place.location) {
        const nextCenter: google.maps.LatLngLiteral = {
          lat: place.location.lat(),
          lng: place.location.lng(),
        };
        setSearchCenter(nextCenter);
        setLocationLabelMode({
          kind: 'custom',
          text: place.formattedAddress || place.displayName || item.mainText,
        });
        map?.panTo(nextCenter);
        map?.setZoom(13);
      }
    } catch (err) {
      console.error('Place details fetch error:', err);
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setLocationMessage(t.nearby.errMoveAddress);
    }
  };

  // Explicit user-initiated geolocation request
  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationMessage(t.nearby.errNoGeolocation);
      return;
    }

    setLocatingUser(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: google.maps.LatLngLiteral = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setSearchCenter(coords);
        setLocationLabelMode({ kind: 'current' });
        setAddressQuery('');
        map?.panTo(coords);
        map?.setZoom(13);
        setLocatingUser(false);
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationMessage(t.nearby.errPermissionDenied);
        } else {
          setLocationMessage(t.nearby.errLocationFailed);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSearchVisibleArea = () => {
    if (!map) return;
    const center = map.getCenter();
    if (!center) return;
    const nextCenter: google.maps.LatLngLiteral = {
      lat: center.lat(),
      lng: center.lng(),
    };
    setSearchCenter(nextCenter);
    setLocationLabelMode({ kind: 'mapArea' });
    setMapPanned(false);
  };

  const visiblePlaces = useMemo(() => {
    if (!openNowOnly) return places;
    return places.filter((p) => p.isOpen === true);
  }, [places, openNowOnly]);

  const handleSelectPlace = (place: NearbyCarePlace) => {
    setSelectedPlaceId(place.id);
    map?.panTo(place.location);
    const currentZoom = map?.getZoom() ?? 13;
    if (currentZoom < 14) {
      map?.setZoom(14);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Emergency Notice */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#475569]">
            {t.nearby.eyebrow}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
            {t.nearby.title}
          </h1>
        </div>
        <p className="text-sm font-medium text-[#475569]">
          {t.nearby.showingArea}{' '}
          <span className="text-[#111C2D] font-semibold">{locationLabel}</span>
        </p>
      </div>

      {/* Location Search & Filter Controls */}
      <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Address / ZIP Search with Autocomplete */}
          <div className="relative flex-1">
            <label htmlFor="care-location-input" className="sr-only">
              {t.nearby.searchAria}
            </label>
            <Search
              className="w-5 h-5 text-[#64748B] absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="care-location-input"
              type="text"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                window.setTimeout(() => setShowSuggestions(false), 180);
              }}
              placeholder={t.nearby.searchPlaceholder}
              className="w-full min-h-[50px] ps-11 pe-4 rounded-2xl border border-[#CBD5E1] bg-white text-base text-[#111C2D] placeholder:text-[#64748B] focus:border-[#0E6B5E] focus:outline-none"
              autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
              <ul
                role="listbox"
                aria-label={t.nearby.suggestionsAria}
                className="absolute z-30 inset-x-0 mt-1.5 bg-white rounded-2xl border border-[#CBD5E1] shadow-xl overflow-hidden divide-y divide-[#E5ECF3]"
              >
                {suggestions.map((item) => (
                  <li key={item.placeId} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        void handleSelectSuggestion(item);
                      }}
                      className="w-full min-h-[50px] px-4 py-2.5 text-start hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    >
                      <span className="block font-semibold text-sm text-[#111C2D]">
                        {item.mainText}
                      </span>
                      {item.secondaryText && (
                        <span className="block text-xs text-[#475569]">
                          {item.secondaryText}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Explicit-Consent Current Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locatingUser}
            className="min-h-[50px] px-5 rounded-2xl bg-[#0E6B5E] hover:bg-[#0B574C] disabled:opacity-60 text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <LocateFixed className="w-5 h-5 shrink-0" />
            <span>
              {locatingUser ? t.nearby.locating : t.nearby.useMyLocation}
            </span>
          </button>
        </div>

        {locationMessage && (
          <p className="text-sm text-[#B45309] font-medium">
            {locationMessage}
          </p>
        )}

        {/* Category Segmented Tabs + Open Now + Radius */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div
            className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 rounded-2xl bg-[#E8EEF5]"
            role="group"
            aria-label={t.nearby.filterTypeAria}
          >
            {categoryOptions.map((opt) => {
              const active = category === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(opt.id)}
                  aria-pressed={active}
                  className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#111C2D] shadow-sm'
                      : 'text-[#475569] hover:text-[#111C2D]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOpenNowOnly((prev) => !prev)}
              aria-pressed={openNowOnly}
              className={`min-h-[44px] px-4 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                openNowOnly
                  ? 'bg-[#0E6B5E] border-[#0E6B5E] text-white'
                  : 'bg-white border-[#CBD5E1] text-[#111C2D] hover:bg-[#F8FAFC]'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{t.nearby.openNow}</span>
            </button>

            <div
              className="inline-flex items-center p-1 rounded-xl bg-[#F1F5F9] border border-[#DCE3EC]"
              role="group"
              aria-label={t.nearby.radiusAria}
            >
              {radiusOptions.map((rad) => {
                const active = radiusMeters === rad.meters;
                return (
                  <button
                    key={rad.meters}
                    type="button"
                    onClick={() => setRadiusMeters(rad.meters)}
                    aria-pressed={active}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                      active
                        ? 'bg-white text-[#111C2D] shadow-sm'
                        : 'text-[#475569] hover:text-[#111C2D]'
                    }`}
                  >
                    {rad.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Map + Results List 2-Column Responsive Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Google Map Container (explicit height to prevent CF2 collapse) */}
        <section className="surface-card lg:col-span-7 rounded-3xl bg-white border border-[#DCE3EC] overflow-hidden">
          <div
            dir="ltr"
            className="relative w-full h-[380px] sm:h-[440px] lg:h-[560px]"
          >
            <GoogleMap
              id="steadydose-nearby-map"
              mapId="DEMO_MAP_ID"
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={13}
              gestureHandling="greedy"
              streetViewControl={false}
              mapTypeControl={false}
              fullscreenControl={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              onDragend={() => setMapPanned(true)}
              className="w-full h-full"
            >
              {/* User's current position pin if opted in */}
              {userLocation && (
                <AdvancedMarker
                  position={userLocation}
                  title={t.nearby.yourCurrentLocation}
                  zIndex={10}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-[#2563EB] border-[3px] border-white shadow-md"
                    aria-label={t.nearby.yourLocationAria}
                  />
                </AdvancedMarker>
              )}

              {/* Live Nearby Healthcare Markers */}
              {visiblePlaces.map((place) => (
                <CareMarker
                  key={place.id}
                  place={place}
                  categoryLabel={categoryLabels[place.category]}
                  isSelected={selectedPlaceId === place.id}
                  isSavedPharmacy={
                    savedPharmacyName.trim().toLowerCase() ===
                    place.displayName.trim().toLowerCase()
                  }
                  onSelect={handleSelectPlace}
                  onClose={() => setSelectedPlaceId(null)}
                  onSavePharmacy={onSavePharmacy}
                />
              ))}
            </GoogleMap>

            {/* Search This Area action when user drags map */}
            {mapPanned && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <button
                  type="button"
                  onClick={handleSearchVisibleArea}
                  className="min-h-[44px] px-4 rounded-xl bg-[#111C2D] hover:bg-[#1E293B] text-white font-semibold text-sm shadow-lg flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>{t.nearby.searchThisArea}</span>
                </button>
              </div>
            )}
          </div>

          {/* Map Key Legend */}
          <div className="px-5 py-3.5 border-t border-[#E5ECF3] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-4 font-semibold text-[#111C2D]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#0E6B5E] text-white text-[10px] font-bold inline-flex items-center justify-center">
                  Rx
                </span>
                <span>{t.nearby.labelPharmacy}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold inline-flex items-center justify-center">
                  C
                </span>
                <span>{t.nearby.labelClinic}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#B91C1C] text-white text-[10px] font-bold inline-flex items-center justify-center">
                  H
                </span>
                <span>{t.nearby.labelHospital}</span>
              </span>
            </div>
            <span className="text-xs text-[#64748B]">
              {t.nearby.emergencyNotice}
            </span>
          </div>
        </section>

        {/* Accessible Results List */}
        <section
          aria-label={t.nearby.listAria}
          className="surface-card lg:col-span-5 rounded-3xl bg-white border border-[#DCE3EC] overflow-hidden flex flex-col lg:max-h-[612px]"
        >
          <div className="px-5 py-4 border-b border-[#E5ECF3] flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111C2D]">
                {t.nearby.nearbyPlaces(visiblePlaces.length)}
              </h2>
              <p className="text-xs text-[#475569]">
                {t.nearby.sortedByDistance}
              </p>
            </div>
            {isSearching && (
              <span className="text-xs font-semibold text-[#0E6B5E]">
                {t.nearby.searching}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#E5ECF3]">
            {searchError ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-sm font-medium text-[#B91C1C]">
                  {searchError}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void runNearbySearch(searchCenter, category, radiusMeters)
                  }
                  className="min-h-[44px] px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-sm font-semibold text-[#111C2D] cursor-pointer"
                >
                  {t.nearby.tryAgain}
                </button>
              </div>
            ) : isSearching && visiblePlaces.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#475569]">
                {t.nearby.findingPlaces}
              </div>
            ) : visiblePlaces.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="font-display font-bold text-base text-[#111C2D]">
                  {t.nearby.noFacilitiesTitle}
                </p>
                <p className="text-sm text-[#475569]">
                  {openNowOnly
                    ? t.nearby.noFacilitiesOpenNow
                    : t.nearby.noFacilitiesGeneral}
                </p>
              </div>
            ) : (
              visiblePlaces.map((place) => {
                const visual = CATEGORY_STYLES[place.category];
                const categoryLabel = categoryLabels[place.category];
                const isSelected = selectedPlaceId === place.id;
                const distanceText = formatDistance(place.distanceMeters);
                const isSaved =
                  savedPharmacyName.trim().toLowerCase() ===
                  place.displayName.trim().toLowerCase();

                return (
                  <article
                    key={place.id}
                    className={`p-4 sm:p-5 transition-colors ${
                      isSelected ? 'bg-[#F0FDF9]' : 'bg-white hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-start cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className={`font-bold ${visual.textClass}`}>
                          {categoryLabel}
                          {place.primaryTypeLabel &&
                          place.primaryTypeLabel.toLowerCase() !==
                            categoryLabel.toLowerCase()
                            ? ` · ${place.primaryTypeLabel}`
                            : ''}
                        </span>
                        {distanceText && (
                          <span
                            dir="ltr"
                            className="font-mono font-semibold text-[#475569] tabular-nums shrink-0"
                          >
                            {distanceText}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-base sm:text-lg font-bold text-[#111C2D] leading-snug">
                        {place.displayName}
                      </h3>

                      {place.formattedAddress && (
                        <p className="text-sm text-[#475569] leading-relaxed">
                          {place.formattedAddress}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569] pt-0.5">
                        {place.isOpen !== null && (
                          <span
                            className={
                              place.isOpen
                                ? 'font-semibold text-[#0E6B5E]'
                                : 'font-semibold text-[#B91C1C]'
                            }
                          >
                            {place.isOpen ? t.nearby.openNow : t.nearby.closedNow}
                          </span>
                        )}
                        {place.rating !== null && (
                          <span
                            dir="ltr"
                            className="inline-flex items-center gap-1 tabular-nums"
                          >
                            {place.isOpen !== null && (
                              <span aria-hidden="true">·</span>
                            )}
                            <Star
                              className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]"
                              aria-hidden="true"
                            />
                            <span className="font-semibold text-[#111C2D]">
                              {place.rating.toFixed(1)}
                            </span>
                            {place.userRatingCount !== null && (
                              <span>({place.userRatingCount})</span>
                            )}
                          </span>
                        )}
                        {place.wheelchairAccessible && (
                          <span>· {t.nearby.wheelchairAccessible}</span>
                        )}
                      </div>

                      {place.todayHoursText && (
                        <p className="text-xs text-[#64748B]">
                          {place.todayHoursText}
                        </p>
                      )}
                    </button>

                    {/* Action buttons row */}
                    <div className="flex flex-wrap items-center gap-2 pt-3">
                      {place.nationalPhoneNumber && (
                        <a
                          href={`tel:${place.nationalPhoneNumber.replace(/[^0-9+]/g, '')}`}
                          className="min-h-[44px] px-3.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#111C2D] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Phone className="w-4 h-4 text-[#0E6B5E] shrink-0" />
                          <span>{t.nearby.call}</span>
                        </a>
                      )}

                      {place.googleMapsURI && (
                        <a
                          href={place.googleMapsURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-3.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#111C2D] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <MapPin className="w-4 h-4 text-[#334155] shrink-0" />
                          <span>{t.nearby.directions}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                        </a>
                      )}

                      {place.category === 'pharmacy' && (
                        <button
                          type="button"
                          onClick={() =>
                            onSavePharmacy(
                              place.displayName,
                              place.nationalPhoneNumber || ''
                            )
                          }
                          className={`min-h-[44px] px-3.5 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                            isSaved
                              ? 'bg-[#0E6B5E] text-white'
                              : 'bg-[#0E6B5E]/10 hover:bg-[#0E6B5E]/15 text-[#0E6B5E]'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-4 h-4 shrink-0" />
                              <span>{t.nearby.myPharmacy}</span>
                            </>
                          ) : (
                            <span>{t.nearby.setAsMyPharmacy}</span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Required Place data attributions whenever present */}
                    {place.attributions.length > 0 && (
                      <div className="pt-2 text-[11px] text-[#64748B] flex flex-wrap gap-2">
                        {place.attributions.map((attr, idx) =>
                          attr.providerURI ? (
                            <a
                              key={idx}
                              href={attr.providerURI}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-[#334155]"
                            >
                              {attr.provider}
                            </a>
                          ) : (
                            <span key={idx}>{attr.provider}</span>
                          )
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

interface NearbyCareViewProps {
  savedPharmacyName: string;
  onSavePharmacy: (name: string, phone: string) => void;
}

export function NearbyCareView({
  savedPharmacyName,
  onSavePharmacy,
}: NearbyCareViewProps) {
  const { meta, t } = useLanguage();

  if (!MAPS_API_KEY) {
    return (
      <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-8 text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-[#111C2D]">
          {t.nearby.title}
        </h1>
        <p className="text-base text-[#475569] max-w-lg mx-auto">
          {t.nearby.notConfiguredBody}
        </p>
      </section>
    );
  }

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      language={meta.mapsLanguage}
      region={meta.mapsRegion}
      libraries={['places', 'marker', 'geometry']}
    >
      <NearbyCareWorkspace
        savedPharmacyName={savedPharmacyName}
        onSavePharmacy={onSavePharmacy}
      />
    </APIProvider>
  );
}
