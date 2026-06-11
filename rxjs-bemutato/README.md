# RxJS Bemutato Projekt

Magyar nyelvu RxJS tutorial projekt, az alapoktol a komplex megoldasokig.

## Telepites

```bash
cd rxjs-bemutato
npm install
```

## Futtatas

Minden fejezet kulon futtathato:

```bash
npm run 01   # Alapok: Observable, Observer, Subscription
npm run 02   # Letrehozo operatorok (of, from, interval, timer, stb.)
npm run 03   # Atalakito operatorok (map, switchMap, mergeMap, stb.)
npm run 04   # Szuro operatorok (filter, take, debounceTime, stb.)
npm run 05   # Kombinalo operatorok (combineLatest, merge, forkJoin, stb.)
npm run 06   # Subjects (Subject, BehaviorSubject, ReplaySubject, stb.)
npm run 07   # Hibakezeles (catchError, retry, timeout, stb.)
npm run 08   # Komplex peldak (keresomezo, polling, cache, state, stb.)
```

## Tartalomjegyzek

### 01 - Alapok
- Observable letrehozasa kezzel
- Observer es subscribe mintak
- Subscription es leiratkozas (memoriaszerivargs!)
- Cold vs Hot Observable
- Observable vs Promise osszehasonlitas

### 02 - Letrehozo operatorok
- `of()` - fix ertekek
- `from()` - tomb, string, Promise, Set
- `interval()` / `timer()` - idozitett ertekek
- `range()` - szamsorozat
- `generate()` - ciklusszeru Observable
- `defer()` - lusta letrehozas
- `EMPTY`, `NEVER`, `throwError` - specialis Observable-ok

### 03 - Atalakito operatorok
- `map()` - ertek atalakitas
- `tap()` - mellekhatas / debug
- `scan()` - futo osszesites (running total)
- `reduce()` - vegso osszesites
- `switchMap()` / `mergeMap()` / `concatMap()` / `exhaustMap()` - belso Observable-ok kezelese (reszletes osszehasonlitas!)
- `pairwise()` - elozo+aktualis parositas
- `bufferCount()` - csoportositas

### 04 - Szuro operatorok
- `filter()` - feltetel alapu szures
- `take()` / `skip()` - darabszam alapu
- `takeWhile()` / `skipWhile()` - feltetel alapu korlatozas
- `takeUntil()` - leallitas masik Observable jelzesere
- `first()` / `last()` / `elementAt()`
- `distinct()` / `distinctUntilChanged()` - ismetlodes szures
- `debounceTime()` / `throttleTime()` - idoalapu szures (reszletes osszehasonlitas!)

### 05 - Kombinalo operatorok
- `combineLatest()` - legfrissebb ertekek kombinacioja
- `merge()` - stream-ek osszefesulese
- `concat()` - egymast utani csatlakozas
- `forkJoin()` - parhuzamos varakozas (mint Promise.all)
- `zip()` - paronkenti kapcsolas
- `race()` - az elso nyeri
- `withLatestFrom()` - fo stream kiegeszitese
- `startWith()` - kezdoertek

### 06 - Subjects
- `Subject` - alap multicast
- `BehaviorSubject` - aktualis ertek tarolasa (+ Mini Store pelda!)
- `ReplaySubject` - korabbi ertekek visszajatszasa
- `AsyncSubject` - vegso ertek

### 07 - Hibakezeles
- Hiba viselkedese kezeles nelkul
- `catchError()` - hiba elkapasa (helyettesites, figyelmen kivul hagyas, atalakitas)
- `retry()` - ujraprobalozas (fix es kesleltett)
- `finalize()` - mindig lefut (try/finally)
- `timeout()` - idotullepes kezeles
- Robusztus API hivas minta (komplex pelda)

### 08 - Komplex gyakorlati peldak
- Keresomezo (Typeahead/Autocomplete)
- Polling (periodikus adatlekerdeses)
- Cache (`shareReplay`)
- Parhuzamos keresek concurrency limit-tel
- Reaktiv allapokezeles (Mini Redux pattern)
- Rate limiter
- Event Sourcing (penzugyi tranzakciok)
- Drag and Drop szimulacio
