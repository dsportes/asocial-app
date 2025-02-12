<template>
  <q-page v-if="session.synthese" class="q-pa-xs">
    <div class="q-my-md spmd">

      <q-expansion-item switch-toggle-side dense group="somegroup"
        header-class="tbp titre-lg" :label="$t('PEoptg')">
        <div class="q-ml-lg q-my-sm">
          <q-toggle class="q-my-sm" v-model="optionA" :label="$t('PTopto')" />
          <div class="q-mb-sm row justify-start" style="height:1.8rem;overflow:hidden">
            <div class="titre-md q-mx-sm">{{$t('ESnbmi')}}</div>
            <q-select class="col-auto items-start items-start text-bold tbp titre-lg q-pl-sm" 
              standout style="position:relative;top:-8px;"
              :disable="session.pow !== 2"
              v-model.number="nbmi" :options="optionsNbmi" dense />
          </div>
        </div>
      </q-expansion-item>

      <q-expansion-item switch-toggle-side dense group="somegroup"
        header-class="tbp titre-lg" :label="$t('PEquotas')">

        <div class="q-ml-lg q-my-sm">
          <div class="q-my-sm row text-italic text-bold titre-md items-center">
            <div class="col-3"></div>
            <div class="col-3 text-center">{{$t('PEqn')}}</div>
            <div class="col-3 text-center">{{$t('PEqv')}}</div>
            <div class="col-3 text-center">{{$t('PEqc')}}</div>
          </div>
          <div class="q-my-xs row items-center">
            <div class="col-3 text-italic titre-md">{{$t('PExesp')}}</div>
            <div class="col-3 text-center font-mono">{{qnE}}</div>
            <div class="col-3 text-center font-mono">{{qvE}}</div>
            <div class="col-3 text-center font-mono">{{qcE}}</div>
          </div>
          <div class="q-my-xs row items-center">
            <div class="col-3 text-right titre-md">{{$t('PEcabo', [mon(aboE[0], 3)])}}</div>
            <div class="col-3 text-center font-mono">{{mon(aboE[1], 3)}}</div>
            <div class="col-3 text-center font-mono">{{mon(aboE[2], 3)}}</div>
            <div class="col-3 text-center font-mono"></div>
          </div>

          <div class="q-mt-sm row items-center">
            <div class="col-3 text-italic titre-md">{{$t('PExcpta')}}</div>
            <div class="col-3 text-center font-mono">{{qnA}}</div>
            <div class="col-3 text-center font-mono">{{qvA}}</div>
            <div class="col-3 text-center font-mono">{{qcA}}</div>
          </div>
          <div class="q-my-xs row items-center">
            <div class="col-3 text-right titre-md">{{$t('PEcabo', [mon(aboA[0], 3)])}}</div>
            <div class="col-3 text-center font-mono">{{mon(aboA[1], 3)}}</div>
            <div class="col-3 text-center font-mono">{{mon(aboA[2], 3)}}</div>
            <div class="col-3 text-center font-mono"></div>
          </div>

          <div class="q-mt-sm row items-center">
            <div class="col-3 text-italic titre-md">{{$t('PExpart')}}</div>
            <div class="col-3 text-center font-mono">{{qnP}}</div>
            <div class="col-3 text-center font-mono">{{qvP}}</div>
            <div class="col-3 text-center font-mono">{{qcP}}</div>
          </div>

          <div class="q-mt-sm row items-center">
            <div class="col-3 text-italic titre-md">{{$t('PExcpto')}}</div>
            <div class="col-3 text-center font-mono">{{qnO}}</div>
            <div class="col-3 text-center font-mono">{{qvO}}</div>
            <div class="col-3 text-center font-mono">{{qcO}}</div>
          </div>
          <div class="q-my-xs row items-center">
            <div class="col-3 text-right titre-md">{{$t('PEcabo', [mon(aboO[0], 3)])}}</div>
            <div class="col-3 text-center font-mono">{{mon(aboO[1], 3)}}</div>
            <div class="col-3 text-center font-mono">{{mon(aboO[2], 3)}}</div>
            <div class="col-3 text-center font-mono"></div>
          </div>

          <div class="q-my-md">
            <div class="row justify-between items-center">
              <span class="titre-md text-bold q-my-sm">{{$t('PIqa')}}</span>
              <btn-cond round icon="edit" class="self-start"  @ok="editerqA()"/>
            </div>
          </div>
        </div>
      </q-expansion-item>
      
      <q-expansion-item switch-toggle-side dense group="somegroup"
        header-class="tbp titre-lg" :label="$t('PEstm1')">
        <div class="q-ml-lg q-my-sm">
          <div class="row q-gutter-xs q-mb-md items-center">
            <div class="titre-md">{{$t('PEstm')}}</div>
            <btn-cond class="self-start b1" label="M" @ok="dlstat(0)"/>
            <btn-cond class="self-start b1" label="M-1" @ok="dlstat(1)"/>
            <btn-cond class="self-start b1" label="M-2" @ok="dlstat(2)"/>
            <btn-cond class="self-start b1" label="M-3" @ok="dlstat(3)"/>
          </div>
          <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl" :dinit="maxdl"
            @ok="dlstat2" icon="download" :label="$t('ESdlc')"/>
        </div>
      </q-expansion-item>

      <q-expansion-item switch-toggle-side dense group="somegroup"
        header-class="tbp titre-lg" :label="$t('PEexpc')">
        <div class="q-ml-lg q-my-sm">
          <saisie-mois v-model="moisexpc"
            @ok="exportCSV" icon="download" :label="$t('ESexpc')"/>
        </div>
      </q-expansion-item>
    </div>

    <div class="row justify-between items-center titre-lg q-pa-xs q-mt-md q-mb-sm tbs">
      <div class="titre-lg text-italic ">{{$t('PEdetpart')}}</div>
      <btn-cond cond="cUrgence" icon="add" class="self-start" :label="$t('PTnv')" @ok="ovnvPart"/>
    </div>

    <div v-if="session.synthese" style="position:relative;top:-20px">
      <filtre-nom class="w10" style="position:relative;top:30px" nom="espace" prop='code' :idx="0"/>
      <div class="row items-end">
        <div class="col-4 trc" @click="clc('code')">{{$t('PEnbde')}}</div>
        <div class="col-1 trc text-center" @click="clc('nbc')">{{$t('PEnbdec')}}</div>
        <div class="col-1 trc text-center" @click="clc('nbd')">{{$t('PEnbded')}}</div>
        <synth-hdrs class="col-6" v-model="igp" :clc="clc"/>
      </div>
      <synth-ligne :igp="igp" :idx="1" :lg="session.synthese.tsp[0]"/>
      <synth-ligne v-for="(lg, idx) in synth" :key="lg.id" :igp="igp" :idx="idx" :lg="lg"/>
    </div>

    <!-- Dialogue de mise à jour des quotas des comptes A -->
    <dial-std1 v-if="m1" v-model="m1" :titre="$t('PTquta')"
      warning :disable="quotasA.err !== '' || !quotasA.chg" cond="cUrgence" :okfn="validerqA">
      <choix-quotas class="q-mt-sm" v-model="quotasA"/>
    </dial-std1>

    <!-- Dialogue de création d'une nouvelle partition -->
    <dial-std1 v-if="m2" v-model="m2" :titre="$t('PTinfoph')"
      warning :disable="disnp" okic="add" cond="cUrgence" :okfn="creer">
      <div class="q-pa-sm">
        <q-input v-model="nom" clearable :placeholder="$t('PTinfoph')">
          <template v-slot:hint>{{$t('PTinfoh')}}</template>
        </q-input>
      </div>
      <choix-quotas v-model="quotasP" />
    </dial-std1>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import SaisieMois from '../components/SaisieMois.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import SynthHdrs from '../components/SynthHdrs.vue'
import SynthLigne from '../components/SynthLigne.vue'
import FiltreNom from '../components/FiltreNom.vue'
import DialStd1 from '../dialogues/DialStd1.vue'
import { dkli, styp, $t, mon, afficherDiag, edvol } from '../app/util.mjs'
import { ID, AMJ, Tarif, UNITEN, UNITEV } from '../app/api.mjs'
import { Synthese } from '../app/modele.mjs'
import { GetSynthese, GetPartition, SetEspaceOptionA, NouvellePartition, SetQuotasA,
  DownloadStatC, DownloadStatC2 } from '../app/operations4.mjs'

const encoder = new TextEncoder('utf-8')
const sep = ','

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m1 = computed(() => ui.d[idc].PEedqA)
const m2 = computed(() => ui.d[idc].PEnt)

async function refreshSynth () {
  await new GetSynthese().run()
}

onMounted(async () => {
  await refreshSynth()
  quotasTA.value = session.synthese.qtA
})

const optionsNbmi = [3, 6, 12, 18, 24]

const aSt = stores.avatar
const fSt = stores.filtre
const session = stores.session
const cfg = stores.config

const igp = ref(0)
const mois = ref(Math.floor(session.auj / 100))
const moisexpc = ref(Math.floor(session.auj / 100))
const nom = ref('')
const quotasP = ref(null)
const quotasA = ref(null)
const quotasTA = ref(null)
const nbmi = ref(session.espace ? session.espace.nbmi : 12)
const optionA = ref(session.espace ? (session.espace.opt ? true : false) : false)
const crTri = ref('code')
const asc = ref(true)
const disnp = computed(() => !nom.value || quotasP.value.err ? true : false)

const aboE = computed(() => Tarif.abo(session.espace.quotas))
const aboA = computed(() => Tarif.abo(session.synthese.qA))
const aboO = computed(() => Tarif.abo(qp.value.qt))

const qnE = computed(() => {
  const q = session.espace.quotas.qn
  return q * UNITEN + ' [' + q + '] '
})

const qvE = computed(() => {
  const q = session.espace.quotas.qv
  return edvol(q * UNITEV) + ' [' + q + '] '
})

const qcE = computed(() => {
  const q = session.espace.quotas.qc
  return '[' + q + 'c] '
})

const qnA = computed(() => {
  const q = session.synthese.qA.qn
  const a = session.synthese.qtA.qn
  return q * UNITEN + ' [' + q + '] ' + pcn(q, a)
})

const qvA = computed(() => {
  const q = session.synthese.qA.qv
  const a = session.synthese.qtA.qv
  return edvol(q * UNITEV) + ' [' + q + '] ' + pcv(q, a)
})

const qcA = computed(() => {
  const q = session.synthese.qA.qc
  const a = session.synthese.qtA.qc
  return '[' + q + 'c] ' + pcc(q, a)
})

const qp = computed(() => session.synthese.tsp[0])

const qP = computed(() => { return {
  qn: session.espace.quotas.qn - session.synthese.qA.qn,
  qv: session.espace.quotas.qv - session.synthese.qA.qv,
  qc: session.espace.quotas.qc - session.synthese.qA.qc }
})

const qnP = computed(() => qP.value.qn * UNITEN + ' [' + qP.value.qn + '] ' + qp.value.pcan + '%')

const qvP = computed(() => edvol(qP.value.qv * UNITEV) + ' [' + qP.value.qv + '] ' + qp.value.pcav + '%')

const qcP = computed(() => '[' + qP.value.qc + 'c] ' + qp.value.pcac + '%')

const qnO = computed(() => qp.value.qt.qn * UNITEN + ' [' + qp.value.qt.qn + '] ')

const qvO = computed(() => edvol(qp.value.qt.qv * UNITEV) + ' [' + qp.value.qt.qv + '] ')

const qcO = computed(() => '[' + qp.value.qt.qc + 'c] ')

const pcn = (q, a) => {
  let pc = q ? (Math.round(a * 100 / (q * UNITEN))) : 999
  if (pc > 999) pc = 999
  return pc + '%'
}

const pcv = (q, a) => {
  let pc = q ? (Math.round(a * 100 / (q * UNITEV))) : 999
  if (pc > 999) pc = 999
  return pc + '%'
}

const pcc = (q, a) => {
  let pc = q ? (Math.round(a * 100 / q)) : 999
  if (pc > 999) pc = 999
  return pc + '%'
}

const clc = (n) => {
  if (n === crTri.value) asc.value = !asc.value
  else crTri.value = n
}

const maxdl = computed(() => { 
  const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
  return Math.floor(m / 100)
})

const mindl = computed(() => Math.floor(session.espace.dcreation / 100))

const synth = computed(() => {
  if (!session.synthese) return []
  const f = fSt.filtre.espace
  const l = []
  const n = crTri.value
  const cd = asc.value ? 1 : -1
  const tsp = session.synthese.tsp
  for (const id in tsp) {
    if (id !== '0') {
      const lg = tsp[id]
      if (f.code) {
        const c = Synthese.pval(lg, 'code', session.compte)
        if (c.indexOf(f.code) === -1) continue
      }
      lg.x = Synthese.pval(lg, n, session.compte)
      l.push(lg)
    }
  }
  l.sort((x, y) => {
    return x.x > y.x ? cd : (x.x < y.x ? -cd : 0) 
  })
  return l
})

/* Export CSV des coûts / partition
4 * 3 colonnes
- 4 quotas: QN, QV, QC et Total (QN + QV + QC)
- 3 compteurs: coût du quota attribué, coût des quotas distribués, coût des quota utilisés
Lignes: id, code, nbc, nbd, et 12 compteurs - 1 ligne de total général
*/
const cols = [
  'abna', 'abnd', 'abnu',
  'abva', 'abvd', 'abvu', 
  'abca', 'abcd', 'abcu',
  'abta', 'abtd', 'abtu',
]

async function exportCSV () {
  const config = stores.config
  const tit = ['id', 'code', 'nbc', 'nbd']
  cols.forEach(c => { tit.push(c)})
  const lignes = [tit.join(sep), '']
  const a = Math.floor(moisexpc.value / 100)
  const m = moisexpc.value % 100
  const cu = Tarif.cu(a, m)
  const cqn = cu[0]
  const cqv = cu[1]

  const tg = { nbc: 0, nbd: 0 }
  cols.forEach(c => { tg[c] = 0})
  const tsp = session.synthese.tsp
  for (const id in tsp) {
    if (id === '0') continue
    const lg = tsp[id]
    const x = {
      id: id,
      code: Synthese.pval(lg, 'code', session.compte),
      nbc: lg.nbc,
      nbd: lg.nbd,
      abna: lg.q.qn * cqn,
      abva: lg.q.qv * cqv,
      abca: lg.q.qc,
      abnd: lg.qt.qn * cqn,
      abvd: lg.qt.qv * cqv,
      abcd: lg.qt.qc,
      abnu: (lg.qt.nc + lg.qt.nn + lg.qt.ng) * cqn / UNITEN,
      abvu: lg.qt.v * cqv / UNITEV,
      abcu: lg.qt.cjm * 30
    }
    x.abta = x.abna + x.abva + x.abca
    x.abtd = x.abnd + x.abvd + x.abcd
    x.abtu = x.abnu + x.abvu + x.abcu
    cols.forEach(c => { tg[c] += x[c]})
    tg.nbc += x.nbc
    tg.nbd += x.nbd
    const y = [x.id, x.code, x.nbc, x.nbd]
    cols.forEach(c => { y.push(Math.round(x[c] * 10000)) })
    lignes.push(y.join(sep))
  }

  const l0 = ['total ' + a + '/' + m, '', tg.nbc, tg.nbd ]
  cols.forEach(c => { l0.push(Math.round(tg[c] * 10000))})
  lignes[1] = l0.join(sep)
  const csv = lignes.join('\n')
  const buf = encoder.encode(csv)
  const blob = new Blob([buf], { type: 'text/csv' })
  if (blob) if (config.mondebug) console.log('blob', 'text/csv', buf.length)
  const nf = moisexpc.value + '.csv'
  saveAs(blob, '' + nf )
  await afficherDiag($t('PEfdisp', [nf]))
}

const optesp = computed(() => session.espace ? (session.espace.opt ? true : false) : false)

const nbmiesp = computed(() => session.espace ? session.espace.nbmi : 12)

watch(optesp, (ap) => { optionA.value = ap })
watch(nbmiesp, (ap) => { nbmi.value = session.espace ? session.espace.nbmi : 12 })
watch(optionA, async (ap) => {
  if (session.espace && ((session.espace.opt ? true : false) !== ap))
    await new SetEspaceOptionA().run(ap ? 1 : 0, null)
  })
watch(nbmi, async (ap) => {
  if (session.espace && session.espace.nbmi !== ap) 
    new SetEspaceOptionA().run(null, ap)
  })

async function dlstat (mr) {
  const cleES = session.compte.cleE
  const { err, blob, creation, mois } = 
    await new DownloadStatC().run(session.espace.org, mr, cleES)
  const nf = session.espace.org + '-C_' + mois
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd' + err))
  }
}

async function dlstat2 () {
  const cleES = session.compte.cleE
  const { err, blob } = await new DownloadStatC2()
    .run(session.espace.org, mois.value, 'C', cleES)
  const nf = session.espace.org + '-C_' + mois.value
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd' + err))
  }
}

async function ovnvPart () { 
  nom.value = ''
  const qm = cfg.quotasMaxP
  const synth = session.synthese
  const q = synth.qA // quotas actuels réservés aux comptes "A"
  const qpt = synth.tsp['0'].q
  const qe = session.espace.quotas
  const rqn = qe.qn - qpt.qn
  let maxn = rqn < 0 ? 0 : rqn
  if (maxn > qm[0]) maxn = qm[0]
  const rqv = qe.qv - qpt.qv
  let maxv = rqv < 0 ? 0 : rqv
  if (maxv > qm[1]) maxv = qm[1]
  const rqc = qe.qc - qpt.qc
  let maxc = rqc < 0 ? 0 : rqc
  if (maxc > qm[2]) maxC = qm[2]
  quotasP.value = { 
    qc: 0, qn: 0, qv: 0,
    minc: 0, minn: 0, minv: 0,
    maxc, maxn, maxv,
    n: 0, v: 0,
    err: ''
  }
  ui.oD('PEnt', idc)
}

async function creer () {
  await new NouvellePartition().run(nom.value || '', quotasP.value)
  await refreshSynth()
  ui.fD()
}

async function editerqA () {
  const synth = session.synthese
  const qm = cfg.quotasMaxA
  const q = synth.qA // quotas actuels réservés aux comptes "A"
  const qpt = synth.tsp['0'].q
  const qe = session.espace.quotas
  const rqn = qe.qn - qpt.qn + q.qn
  let maxn = rqn < 0 ? q.qn : rqn
  if (maxn > qm[0]) maxn = qm[0]
  const rqv = qe.qv - qpt.qv + q.qv
  let maxv = rqv < 0 ? q.qv : rqv
  if (maxv > qm[1]) maxv = qm[1]
  quotasA.value = { 
    qc: q.qc, qn: q.qn, qv: q.qv,
    minc: 0, minn: 0, minv: 0,
    maxc: qm[2], maxn, maxv,
    err: ''
  }
  ui.oD('PEedqA', idc)
}

async function validerqA () {
  await new SetQuotasA().run(quotasA.value)
  await refreshSynth()
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w10
  width: 10rem
.b1
  min-width: 2.5rem !important
  padding: 0 5px
  color: white
  background: var(--q-primary)
  cursor: pointer
  border-radius: 6px
  text-align: center
.trc
  font-weight: bold
  font-style: italic
  text-decoration: underline
  cursor: pointer
  color: var(--q-primary)
.w10
  max-width: 10rem
</style>
