<template>
<div :class="dkli + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title v-if="avid!==0" class="titre-lg full-width text-center">{{$t('SAVtit1', [na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-else class="titre-lg full-width text-center text-bold bg-yellow-5 text-negative">
        {{$t('SAVtit2', [na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <div class="row justify-center items-center">
      <div class="titre-md text-bold text-italic q-mr-md">{{$t('SAVval' + (avid !== 0 ? '1' : '2'))}}</div>
      <bouton-confirm :actif="checksOK" :confirmer="ovconfirmsuppr"/>
    </div>
  </q-header>

  <q-page-container>
    <q-page :class="dkli + ' q-pa-xs'">

      <div v-if="s.dspt" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="s.checks._dspt" :label="$t('vu')" />
        <div class="col titre-md">{{$t('SAVdspt')}}</div>
      </div>

      <div class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="s.checks._notes" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVnotes', s.nbn, { count: s.nbn })}}</div>
          <div v-if="s.nbn" class="q-my-sm q-ml-md">{{$t('SAVvlib', [edvol(s.v1n), edvol(s.v2n)])}}</div>
        </div>
      </div>

      <div class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" v-model="s.checks._chats" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVchats', s.ch.length, { count: s.ch.length })}}</div>
          <div v-if="s.ch.length" class="q-ml-md">
            <span v-for="c in s.ch" :key="c.pk" class="q-my-sm q-mr-sm b1">{{c.naE.nomc}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.sp.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" v-model="s.checks._spons" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVspons', s.sp.length, { count: s.sp.length })}}</div>
          <div class="q-ml-md">
            <span v-for="s in s.sp" :key="s.ids" class="q-my-sm q-mr-sm b1">
              {{s.descr.naf.nomc}}
            </span>
          </div>
        </div>
      </div>

      <div v-if="s.gr1.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="s.checks._gr1" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr1', s.gr1.length, { count: s.gr1.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr1" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib1', x.nbn, {count: x.nbn})}}</span>
            <span class="q-ml-sm">{{$t('SAVvlib', [edvol(x.v1), edvol(x.v2)])}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr2.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="s.checks._gr2" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr2', s.gr2.length, { count: s.gr2.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr2" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib2', x.nbn, {count: x.nbn})}}</span>
            <span class="q-ml-sm">{{$t('SAVvlib', [edvol(x.v1), edvol(x.v2)])}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr3.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="s.checks._gr3" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr3', s.gr3.length, { count: s.gr3.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr3" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib2', x.nbn, {count: x.nbn})}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr0.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="s.checks._gr0" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr0', s.gr0.length, { count: s.gr0.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr0" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib2', x.nbn, {count: x.nbn})}}</span>
          </div>
        </div>
      </div>

      <div v-if="avid !== 0" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="s.checks._vol" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVvol')}}</div>        
          <div class="q-ml-md q-my-sm">{{$t('SAVvolt', [edvol(s.v1n + s.v1g), edvol(s.v2n + s.v2g)])}}</div>
          <div class="q-ml-lg q-my-sm">{{$t('SAVvola', [edvol(s.v1n), edvol(s.v2n)])}}</div>
          <div class="q-ml-lg q-my-sm">{{$t('SAVvolg', [edvol(s.v1g), edvol(s.v2g)])}}</div>
        </div>
      </div>

    </q-page>
  </q-page-container>

  <q-dialog v-model="confirmsuppr" persistent>
  <q-card class="bs largeur30 q-pa-sm">
    <div class="q-mt-md titre-lg text-italic">{{$t('SAVcf' + (avid !== 0 ? '1' : '2'))}}</div>
    <div class="q-mt-md row justify-center q-gutter-md">
      <q-btn class="q-pa-xs" size="md" dense :label="$t('renoncer')" color="primary" @click="MD.fD"/>
      <bouton-confirm actif :confirmer="valider"/>
    </div>
  </q-card>
</q-dialog>

</q-layout>
</div>
</template>

<script>
import { ref, toRef, reactive } from 'vue'
import { MD, getNg, Compta, Versions } from '../app/modele.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { edvol, afficherDiag, sleep } from '../app/util.mjs'
import { AMJ, limitesjour } from '../app/api.mjs'
import { SupprAvatar } from '../app/operations.mjs'

export default ({
  name: 'SupprAvatar',

  props: { avid: Number },

  components: { BoutonHelp, BoutonConfirm },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    checksOK () { 
      for (const x in this.s.checks) if (!this.s.checks[x]) return false
      return true 
    }
  },

  data () {
    return {
    }
  },

  watch: {
  },

  methods: {
    setCheck (x) {
      this.s.checks[x] = true
    },

    /* Supprimer un avatar ****************************************
    args.token: éléments d'authentification du compte.
    args.id : id de l'avatar
    args.va : version de l'avatar
    args.idc : id du compte - si égal à id, suppression du compte
    args.idk : cet id crypté par la clé K du compte. Clé de la map mavk dans compta
    args.chats : liste des id / ids des chats externes à traiter
    args.spons : liste des ids des sponsorings à purger
    args.dfh : date de fin d'hébergement des groupes
    args.grps : liste des items groupes à traiter.
      - idg : id du groupe
      - vg : version du groupe
      - im : ids du membre (correspondant à l'avatar)
      - suppr : true si le groupe est à supprimer
    Suppression de compte seulement
    args.idt: id de la tribu du compte
    args.rndc: clé du compte dans mbtr de tribu2, pour suppression de cette entrée
    Suppression d'avatar seulement
    args.dv1: réduction du volume v1 du compte (notes avatar et notes des groupes hébergés)
    args.dv2
    Retour: OK
    - true : suprresion OK
    - false : retry requis, les versions des groupes et/ou avatar ont chnagé
    */
    async valider () {
      MD.fD() // boite de confirmation
      await sleep(50)
      const args = {
        id: this.na.id,
        va: Versions.v(this.na.id),
        idc: this.session.compteId,
        idf: await Compta.mavkK(this.na.id, this.session.clek),
        dfh: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), limitesjour.groupenonheb)
      }
      if (this.avid === 0) {
        args.idt = this.s.idt
        args.rndc = getNg(this.session.compteId).hrnd
      } else {
        args.dv1 = this.s.v1n + this.s.v1g
        args.dv2 = this.s.v2n + this.s.v2g
      }
      args.chats = []
      this.s.ch.forEach(c => { args.chats.push([c.id, c.ids])})
      args.spons = []
      this.s.sp.forEach(s => { args.spons.push(s.ids)})
      args.grps = []
      this.s.gr0.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.mb.ids, suppr: false })})
      this.s.gr1.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.mb.ids, suppr: true })})
      this.s.gr2.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.mb.ids, suppr: false })})
      this.s.gr3.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.mb.ids, suppr: false })})
      const ok = await new SupprAvatar().run(args)
      if (!ok) {
        await afficherDiag(this.$t('SAVret' + (this.avid ? '1' : '2')))
        this.init()
      } else {
        MD.fD() // Dialogue de suppression
      }
    }
  },

  setup (props) {
    const session = stores.session
    const cfg = stores.config
    const avid = toRef(props, 'avid')
    const na = ref(getNg(avid.value ? avid.value : session.compteId))
    const aSt = stores.avatar
    const nSt = stores.note
    const gSt = stores.groupe

    const s = reactive( { 
      checks: {},
      stats: {}, // map des nbn notes, v1 v2 par avatar et groupe
      ch: [], // liste des chats
      gr0: [], // liste des groupes
      gr1: [], // liste des groupes
      gr2: [], // liste des groupes
      gr3: [], // liste des groupes
      sp: [], // liste des sponsorings
      v1g: 0, // v1 total des groupes hébérgés
      v2g: 0, // v2 total des groupes hébérgés
      v1n: 0, // v1 total des notes de l'avatar
      v2n: 0, // v2 total des notes de l'avatar
      nbn: 0,  // nbre total des notes de l'avatar
      // résiliation compte
      dspt: false, // dernier sponsor de sa tribu
      hrnd: 0,
      idt: 0
    } )

    function init () {
      const id = na.value.id
      s.checks = { _notes: false, _chats: false }
      s.v1g = 0; s.v2g = 0
      s.stats = nSt.statsParRacine
      const a = s.stats[id]
      s.v1n = a.v1; s.v2n = a.v2; s.nbn = a.n
      const e = aSt.getElt(id)
      s.ch = Array.from(e.chats.values())
      s.sp = []
      for (const sp of Array.from(e.sponsorings.values()))
        if (sp.st === 0) s.sp.push(sp)
      if (s.sp.length) s.checks._spons = false
      e.grIds.forEach(idg => {
        const egr = gSt.egr(idg)
        const x = {}
        x.gr = egr.groupe
        x.mb = gSt.membreDeId(egr, id)
        if (x.gr.imh === x.mb.ids) { 
          x.heb = true; x.nbn = s.stats[idg].n; x.v1 = egr.objv.vols.v1; x.v2 = egr.objv.vols.v2
          s.v1g += x.v1; s.v2g += x.v2
        }
        const y = gSt.animIds(egr); if (y.size === 1 && y.has(id)) x.dan = true
        const z = gSt.actifIds(egr); if (z.size === 1 && z.has(id)) x.dac = true
        x.nbn = s.stats[idg].n
        x.st = x.dac ? 1 : (x.heb ? 2 : (x.dan ? 3 : 0))
        s['gr' + x.st].push(x)
      })
      for (let i = 0; i < 4; i++) if (s['gr' + i].length) s.checks['_gr' + i] = false
      if (avid.value === 0) {
        const tribu2 = aSt.tribu2
        const setSp = tribu2.idSponsors
        s.dspt = setSp.size === 1 && setSp.has(id)
        s.idt = tribu2.id
        if (s.dspt) s.checks._dspt = false
      } else {
        s.checks._vol = false
      }
    }

    nSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setNote' || name === 'delNote') init()
      })
    })

    const names1 = new Set(['setCompte', 'setAvatar', 'setChat', 'setSponsoring', 'del'])
    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (names1.has(name)) init()
      })
    })

    const names2 = new Set(['setGroupe', 'setMembre', 'delGroupe', 'delMembre'])
    gSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (names2.has(name)) init()
      })
    })

    init()

    const confirmsuppr = ref(false)
    function ovconfirmsuppr () { MD.oD(confirmsuppr) }

    return {
      session, cfg,
      confirmsuppr, ovconfirmsuppr,
      MD, edvol, aSt, na, s, init
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
.cb
  position: relative
  font-style: italic
  top: -0.5rem
  margin-right: 1rem
.b1
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 1px 3px
</style>
