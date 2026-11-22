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

const CATEGORY_OPTIONS: Array<{
  id: CareCategory;
  label: string;
  types: string[];
}> = [
  {
    id: 'all',
    label: 'All Care',
    types: [
      'pharmacy',
      'drugstore',
      'medical_clinic',
      'doctor',
      'hospital',
      'general_hospital',
    ],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacies',
    types: ['pharmacy', 'drugstore'],
  },
  {
    id: 'clinic',
    label: 'Clinics',
    types: ['medical_clinic', 'doctor', 'medical_center'],
  },
  {
    id: 'hospital',
    label: 'Hospitals',
    types: ['hospital', 'general_hospital'],
  },
];

const RADIUS_OPTIONS: Array<{ label: string; meters: number }> = [
  { label: '2 mi', meters: 3219 },
  { label: '5 mi', meters: 8047 },
  { label: '10 mi', meters: 16093 },
];

const CATEGORY_VISUALS: Record<
  Exclude<CareCategory, 'all'>,
  {
    label: string;
    glyph: string;
    pinBg: string;
    pinBorder: string;
    textClass: string;
  }
> = {
  pharmacy: {
    label: 'Pharmacy',
    glyph: 'Rx',
    pinBg: '#0E6B5E',
    pinBorder: '#08473E',
    textClass: 'text-[#0E6B5E]',
  },
  clinic: {
    label: 'Clinic',
    glyph: 'C',
    pinBg: '#1D4ED8',
    pinBorder: '#1E3A8A',
    textClass: 'text-[#1D4ED8]',
  },
  hospital: {
    label: 'Hospital',
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

function formatMiles(meters: number | null): string | null {
  if (meters == null || Number.isNaN(meters)) return null;
  const miles = meters / 1609.344;
  return miles < 0.1 ? '< 0.1 mi' : `${miles.toFixed(1)} mi`;
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
  isSelected: boolean;
  isSavedPharmacy: boolean;
  onSelect: (place: NearbyCarePlace) => void;
  onClose: () => void;
  onSavePharmacy?: (name: string, phone: string) => void;
}

function CareMarker({
  place,
  isSelected,
  isSavedPharmacy,
  onSelect,
  onClose,
  onSavePharmacy,
}: CareMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const visual = CATEGORY_VISUALS[place.category];
  const distanceLabel = formatMiles(place.distanceMeters);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={`${place.displayName} (${visual.label})`}
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
          <div className="p-1 space-y-2 text-[#111C2D]">
            <div>
              <p className={`text-xs font-bold ${visual.textClass}`}>
                {visual.label}
                {distanceLabel ? ` · ${distanceLabel}` : ''}
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
                  {place.isOpen ? 'Open now' : 'Closed now'}
                </span>
              )}
              {place.rating !== null && (
                <span className="text-[#475569] tabular-nums">
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
                <span>{place.nationalPhoneNumber}</span>
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
                  <span>Directions</span>
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
                      <span>Saved Pharmacy</span>
                    </>
                  ) : (
                    <span>Save as My Pharmacy</span>
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

interface NearbyCareWorkspaceProps {
  savedPharmacyName: string;
  onSavePharmacy: (name: string, phone: string) => void;
}

function NearbyCareWorkspace({
  savedPharmacyName,
  onSavePharmacy,
}: NearbyCareWorkspaceProps) {
  const map = useMap('steadydose-nearby-map');
  const placesLibrary = useMapsLibrary('places');
  const geometryLibrary = useMapsLibrary('geometry');

  const [searchCenter, setSearchCenter] =
    useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>(
    'San Francisco, CA (default area)'
  );
  const [category, setCategory] = useState<CareCategory>('all');
  const [radiusMeters, setRadiusMeters] = useState<number>(8047); // 5 mi
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

      const categoryConfig =
        CATEGORY_OPTIONS.find((opt) => opt.id === activeCategory) ??
        CATEGORY_OPTIONS[0];

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
          includedPrimaryTypes: categoryConfig.types,
          maxResultCount: 15,
          rankPreference: placesLibrary.SearchNearbyRankPreference.DISTANCE,
          language: 'en',
          region: 'US',
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
                displayName: p.displayName || 'Healthcare Facility',
                formattedAddress: p.formattedAddress || '',
                category: resolvedCategory,
                primaryTypeLabel:
                  p.primaryTypeDisplayName ||
                  CATEGORY_VISUALS[resolvedCategory].label,
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
          setSearchError(
            'Google Maps Platform quota limit reached. Please see the banner above for account options.'
          );
        } else {
          setSearchError(
            'Unable to load nearby locations right now. Please check your connection and try again.'
          );
        }
        setPlaces([]);
      } finally {
        if (reqId === searchRequestCounterRef.current) {
          setIsSearching(false);
        }
      }
    },
    [placesLibrary, geometryLibrary]
  );

  // Trigger nearby search when Places library is ready or filters/center change
  useEffect(() => {
    if (!placesLibrary) return;
    void runNearbySearch(searchCenter, category, radiusMeters);
  }, [placesLibrary, searchCenter, category, radiusMeters, runNearbySearch]);

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
              language: 'en',
              region: 'US',
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
  }, [addressQuery, placesLibrary]);

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
        setLocationLabel(
          place.formattedAddress || place.displayName || item.mainText
        );
        map?.panTo(nextCenter);
        map?.setZoom(13);
      }
    } catch (err) {
      console.error('Place details fetch error:', err);
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setLocationMessage('Could not move to that address. Please try another.');
    }
  };

  // Explicit user-initiated geolocation request
  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationMessage(
        'Location services are not available in this browser. Try searching your city or ZIP code above.'
      );
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
        setLocationLabel('Your current location');
        setAddressQuery('');
        map?.panTo(coords);
        map?.setZoom(13);
        setLocatingUser(false);
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationMessage(
            'Location permission was declined. You can type your city, address, or ZIP code above instead.'
          );
        } else {
          setLocationMessage(
            'Could not determine your location right now. Try entering your address or ZIP code above.'
          );
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
    setLocationLabel('Current map area');
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
            Local Healthcare Locator
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111C2D] tracking-tight mt-0.5">
            Nearby Pharmacies, Clinics & Hospitals
          </h1>
        </div>
        <p className="text-sm font-medium text-[#475569]">
          Showing area: <span className="text-[#111C2D] font-semibold">{locationLabel}</span>
        </p>
      </div>

      {/* Location Search & Filter Controls */}
      <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Address / ZIP Search with Autocomplete */}
          <div className="relative flex-1">
            <label htmlFor="care-location-input" className="sr-only">
              Search by city, ZIP code, or street address
            </label>
            <Search
              className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
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
              placeholder="Enter city, ZIP code, or address..."
              className="w-full min-h-[50px] pl-11 pr-4 rounded-2xl border border-[#CBD5E1] bg-white text-base text-[#111C2D] placeholder:text-[#64748B] focus:border-[#0E6B5E] focus:outline-none"
              autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
              <ul
                role="listbox"
                aria-label="Address suggestions"
                className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#CBD5E1] shadow-xl overflow-hidden divide-y divide-[#E5ECF3]"
              >
                {suggestions.map((item) => (
                  <li key={item.placeId} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        void handleSelectSuggestion(item);
                      }}
                      className="w-full min-h-[50px] px-4 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
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
            <span>{locatingUser ? 'Locating...' : 'Use My Location'}</span>
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
            aria-label="Filter by healthcare facility type"
          >
            {CATEGORY_OPTIONS.map((opt) => {
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
              <span>Open Now</span>
            </button>

            <div
              className="inline-flex items-center p-1 rounded-xl bg-[#F1F5F9] border border-[#DCE3EC]"
              role="group"
              aria-label="Search distance radius"
            >
              {RADIUS_OPTIONS.map((rad) => {
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
          <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[560px]">
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
                  title="Your current location"
                  zIndex={10}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-[#2563EB] border-[3px] border-white shadow-md"
                    aria-label="Your location"
                  />
                </AdvancedMarker>
              )}

              {/* Live Nearby Healthcare Markers */}
              {visiblePlaces.map((place) => (
                <CareMarker
                  key={place.id}
                  place={place}
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
                  <span>Search This Area</span>
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
                <span>Pharmacy</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold inline-flex items-center justify-center">
                  C
                </span>
                <span>Clinic</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#B91C1C] text-white text-[10px] font-bold inline-flex items-center justify-center">
                  H
                </span>
                <span>Hospital</span>
              </span>
            </div>
            <span className="text-xs text-[#64748B]">
              For emergencies, dial 911 or local emergency services.
            </span>
          </div>
        </section>

        {/* Accessible Results List */}
        <section
          aria-label="Nearby healthcare facilities list"
          className="surface-card lg:col-span-5 rounded-3xl bg-white border border-[#DCE3EC] overflow-hidden flex flex-col lg:max-h-[612px]"
        >
          <div className="px-5 py-4 border-b border-[#E5ECF3] flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111C2D]">
                Nearby Places ({visiblePlaces.length})
              </h2>
              <p className="text-xs text-[#475569]">
                Sorted by distance · Tap any place to view on map
              </p>
            </div>
            {isSearching && (
              <span className="text-xs font-semibold text-[#0E6B5E]">
                Searching...
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
                  Try Again
                </button>
              </div>
            ) : isSearching && visiblePlaces.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#475569]">
                Finding nearby pharmacies, clinics, and hospitals...
              </div>
            ) : visiblePlaces.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="font-display font-bold text-base text-[#111C2D]">
                  No matching facilities found
                </p>
                <p className="text-sm text-[#475569]">
                  {openNowOnly
                    ? 'Try turning off the "Open Now" filter or widening your search radius.'
                    : 'Try expanding the distance radius or searching a nearby city.'}
                </p>
              </div>
            ) : (
              visiblePlaces.map((place) => {
                const visual = CATEGORY_VISUALS[place.category];
                const isSelected = selectedPlaceId === place.id;
                const distanceText = formatMiles(place.distanceMeters);
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
                      className="w-full text-left cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className={`font-bold ${visual.textClass}`}>
                          {visual.label}
                          {place.primaryTypeLabel &&
                          place.primaryTypeLabel.toLowerCase() !==
                            visual.label.toLowerCase()
                            ? ` · ${place.primaryTypeLabel}`
                            : ''}
                        </span>
                        {distanceText && (
                          <span className="font-mono font-semibold text-[#475569] tabular-nums shrink-0">
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
                            {place.isOpen ? 'Open now' : 'Closed now'}
                          </span>
                        )}
                        {place.rating !== null && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
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
                          <span>· Wheelchair accessible entrance</span>
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
                          <span>Call</span>
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
                          <span>Directions</span>
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
                              <span>My Pharmacy</span>
                            </>
                          ) : (
                            <span>Set as My Pharmacy</span>
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
  if (!MAPS_API_KEY) {
    return (
      <section className="surface-card rounded-3xl bg-white border border-[#DCE3EC] p-8 text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-[#111C2D]">
          Nearby Pharmacies, Clinics & Hospitals
        </h1>
        <p className="text-base text-[#475569] max-w-lg mx-auto">
          Google Maps Platform is not configured yet. Please complete Google Maps
          setup to view live nearby pharmacies, clinics, and hospitals on an
          interactive map.
        </p>
      </section>
    );
  }

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      language="en"
      region="US"
      libraries={['places', 'marker', 'geometry']}
    >
      <NearbyCareWorkspace
        savedPharmacyName={savedPharmacyName}
        onSavePharmacy={onSavePharmacy}
      />
    </APIProvider>
  );
}
