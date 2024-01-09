<template>
<q-dialog v-model="ui.d.SAsuppravatar" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
      <q-toolbar-title v-if="avid!==0" class="titre-lg full-width text-center">{{$t('SAVtit1', [na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-else class="titre-lg full-width text-center text-bold bg-yellow-5 text-negative">
        {{$t('SAVtit2', [na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <div class="row justify-center items-center">
      <div class="titre-md text-bold text-italic q-mr-md">{{$t('SAVval' + (avid !== 0 ? '1' : '2'))}}</div>
      <bouton-confirm :actif="checksOK" :confirmer="cftop"/>
    </div>
  </q-header>

  <q-page-container>
    <q-page :class="dkli(0) + ' q-pa-xs'">

      <div v-if="s.dspt" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._dspt" :label="$t('vu')" />
        <div class="col titre-md">{{$t('SAVdspt')}}</div>
      </div>

      <div class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._notes" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVnotes', nbn, { count: nbn })}}</div>
          <div v-if="nbn" class="q-my-sm q-ml-md">{{$t('SAVvlib', [edvol(v2n)])}}</div>
        </div>
      </div>

      <div class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" v-model="checks._chats" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVchats', s.ch.length, { count: s.ch.length })}}</div>
          <div v-if="s.ch.length" class="q-ml-md">
            <span v-for="c in s.ch" :key="c.pk" class="q-my-sm q-mr-sm b1">{{c.naE.nomc}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.sp.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" v-model="checks._spons" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVspons', s.sp.length, { count: s.sp.length })}}</div>
          <div class="q-ml-md">
            <span v-for="x in s.sp" :key="x.ids" class="q-my-sm q-mr-sm b1">
              {{x.descr.naf.nomc}}
            </span>
          </div>
        </div>
      </div>

      <div v-if="s.gr1.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr1" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr1', s.gr1.length, { count: s.gr1.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr1" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib1', x.nn, {count: x.nn})}}</span>
            <span class="q-ml-sm">{{$t('SAVvlib', [edvol(x.v2)])}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr2.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr2" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr2', s.gr2.length, { count: s.gr2.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr2" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
            <span class="q-ml-sm">{{$t('SAVvlib3m', [edvol(x.v2)])}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr3.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr3" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr3', s.gr3.length, { count: s.gr3.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr3" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr0.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr0" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr0', s.gr0.length, { count: s.gr0.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr0" :key="x.gr.id">
            <span class="b1 q-mr-lg">{{x.gr.na.nomc}}</span>
            <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
          </div>
        </div>
      </div>

      <div v-if="avid !== 0" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._vol" :label="$t('vu')" />
        <div class="col">
          <div v-if="s.nna + s.nng" class="titre-md">{{$t('SAVvol')}}</div>        
          <div v-if="s.nna" class="q-ml-lg q-my-sm">{{$t('SAVvola', [s.nna, edvol(s.v2a)])}}</div>
          <div v-if="s.nng" lass="q-ml-lg q-my-sm">{{$t('SAVvolg', [s.nng, edvol(s.v2g)])}}</div>
          <div class="titre-md">{{$t('SAVabo')}}</div>        
          <div class="q-ml-md q-my-sm">{{$t('SAVabo1', [s.nna + s.nng, s.ch.length, s.ng])}}</div>
          <div v-if="s.v2a" class="q-ml-md q-my-sm">{{$t('SAVabo2', [edvol(s.v2a)])}}</div>
        </div>
      </div>

    </q-page>
  </q-page-container>

  <q-dialog v-model="ui.d.SAconfirmsuppr" persistent>
    <q-card :class="styp('sm') + 'q-pa-sm'">
      <div class="q-mt-md titre-lg text-italic">{{$t('SAVcf' + (avid !== 0 ? '1' : '2'))}}</div>
      <div class="q-mt-md row justify-center q-gutter-md">
        <q-btn class="q-pa-xs" size="md" dense :label="$t('renoncer')" 
          color="primary" @click="ui.fD"/>
        <bouton-confirm actif :confirmer="valider"/>
      </div>
    </q-card>
  </q-dialog>

</q-layout>
</q-dialog>
</template>

<script>
// import { ref, toRef, reactive } from 'vue'
import { getNg, Avatar, Versions } from '../app/modele.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { styp, edvol, afficherDiag, sleep, dkli } from '../app/util.mjs'
import { AMJ, limitesjour, FLAGS } from '../app/api.mjs'
import { SupprAvatar } from '../app/operations.mjs'

export default ({
  name: 'SupprAvatar',

  props: { avid: Number },

  components: { BoutonHelp, BoutonConfirm },

  computed: {
    na () { return getNg(this.avid || this.session.compteId) },

    checksOK () { 
      for (const x in this.s.checks) 
        if (this.s.checks[x] && !this.checks[x]) return false
      return true 
    },

    nbn () { return this.s.nna + this.s.nng },

    v2n () { return this.s.v2a + this.s.v2g },

    s () { // TODO dans les listes de groupes s.gr0 ... s.gr3, les éléments x.mb sont remplacés par x.im
      const s = {
        touches: {},
        checks: { 
          _notes: true, _chats: true, _spons: false, _dspt: false, _vols: false,
          _gr0: false, _gr1: false, _gr2: false, _gr3: false, _gr4: false 
        },
        stats: {}, // map des nbn notes, v1 v2 par avatar et groupe
        /* gri : { 
          heb, dan, dac : est hébergeur, dernier actif, dernier animateur
          nnh, v2h : si hébergeur, nombre de notes et volume des fichiers hébergés
          nn, v2 : nombre de notes et volume des fichiers
          gr, im : groupe, indice membre  
        }
        */
        ng: 0, // nombres de groupes accédés
        gr1: [], // liste des groupes où l'avatar est le dernier actif
        gr2: [], // liste des groupes dont l'avatar est hébergeur (mais pas dernier actif)
        gr3: [], // liste des groupes dont l'avatar est le dernier animateur (mais pas hébergeur ni le dernier actif)
        gr0: [], // liste des autres groupes ou l'avatar apparaît

        sp: [], // liste des sponsorings
        ch: [], // liste des chats

        nng: 0, // nombre total de notes des groupes hébérgés
        v2g: 0, // v2 total des fichiers des notes des groupes hébérgés

        nna: 0, // nombre total des notes de l'avatar
        v2a: 0, // v2 total des fichiers des notes de l'avatar

        // résiliation compte
        dspt: false, // dernier sponsor de sa tribu
        hrnd: 0,
        idt: 0, // id de la tribu
        it: 0 // indice du compte dans sa tribu
      }

      const id = this.na.id
      s.nng = 0; s.v2g = 0; s.ng = 0
      s.stats = this.nSt.statsParRacine

      const a = s.stats[id]
      s.nna = a.nn; s.v2a = a.v2

      const e = this.aSt.getElt(id)
      s.touches[id] = e.avatar
      e.chats.forEach(c => {
        s.touches[c.id + '/' + c.ids] = c
        s.ch.push(c)
      })
      s.ch = Array.from(e.chats.values())

      s.sp = []
      e.sponsorings.forEach(sp => { 
        if (sp.st === 0) {
          s.touches[sp.id + '/' + sp.ids] = sp
          s.sp.push(sp) 
        }
      })
      if (s.sp.length) s.checks._spons = true

      this.aSt.compte.idGroupes(id).forEach(idg => {
        s.ng++
        const egr = this.gSt.egr(idg)
        const x = {}
        x.gr = egr.groupe
        x.im = this.aSt.compte.imGA(idg, id)
        x.nn = egr.objv.vols.v1
        x.v2 = egr.objv.vols.v2
        if (x.gr.imh === x.im) { 
          x.heb = true
          x.nnh = x.nn
          x.v2h = x.v2
          s.nng += x.nn
          s.v2g += x.v2
        } else {
          x.nnh = 0
          x.v2h = 0
        }
        
        let nan = 0, nac = 0, estAn = false, estAc = false
        for (let i = 1; i < x.gr.flags.length; i++) {
          const f = x.gr.flags[i]
          if (f & FLAGS.AN) { nan++; if (i == x.im) estAn = true }
          if (f & FLAGS.AC) { nac++; if (i == x.im) estAc = true }
        }
        x.dan = nan === 1 && estAn
        x.dac = nac === 1 && estAc

        x.st = x.dac ? 1 : (x.heb ? 2 : (x.dan ? 3 : 0))
        s['gr' + x.st].push(x)
      })

      for (let i = 0; i < 4; i++) if (s['gr' + i].length) s.checks['_gr' + i] = true

      if (this.avid === 0) {
        s.it = this.aSt.compta.it
        s.idt = this.aSt.compta.idt
        if (s.it) {
          const setSp = this.aSt.tribu.idSponsors
          s.dspt = setSp.size === 1 && setSp.has(id)
          if (s.dspt) s.checks._dspt = true
        } 
      } else {
        s.checks._vol = true
      }
      return s
    }
  },

  data () {
    return {
      checks: { 
        _notes: false, _chats: false, _spons: false, _dspt: false, _vol: false,
        _gr0: false, _gr1: false, _gr2: false, _gr3: false, _gr4: false 
      }
    }
  },

  watch: {
    s () {
      for (const x in this.checks) this.checks[x] = false 
    }
  },

  methods: {
    cftop () {
      this.ui.oD('SAconfirmsuppr')
    },

    /* Supprimer un avatar ****************************************
    args.token: éléments d'authentification du compte.
    args.id : id de l'avatar
    args.va : version de l'avatar
    args.vap: version de l'avatar principal
    args.idc : id du compte - si égal à id, suppression du compte
    args.idk : cet id court crypté par la clé K du compte. Clé de la map mavk dans compta
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
    args.it: indice du compte dans act de tribu, pour suppression de cette entrée
    Suppression d'avatar seulement
    args.dnn, dnc, dng: réduction du nombre de notes, chats, groupes
    args.dv2
    Retour: OK
    - true : suppresion OK
    - false : retry requis, les versions des groupes et/ou avatar ont chagé
    */
    async valider () {
      this.ui.fD() // boite de confirmation
      await sleep(50)
      const args = {
        id: this.na.id,
        va: Versions.v(this.na.id),
        vap: Versions.v(this.session.compteId),
        idc: this.session.compteId,
        idk: await Avatar.mavkK(this.na.id),
        dfh: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), limitesjour.groupenonheb)
      }
      if (this.avid === 0) {
        args.idt = this.s.idt
      } else {
        args.dnn = this.s.nna + this.s.nng
        args.dnc = this.s.ch.length
        args.dng = this.s.ng
        args.dv2 = this.s.v2a + this.s.v2g
      }
      args.chats = []
      this.s.ch.forEach(c => { args.chats.push([c.id, c.ids])})
      args.spons = []
      this.s.sp.forEach(s => { args.spons.push(s.ids)})
      args.grps = []
      this.s.gr0.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.im, suppr: false })})
      this.s.gr1.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.im, suppr: true })})
      this.s.gr2.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.im, suppr: false })})
      this.s.gr3.forEach(x => { args.grps.push({ idg: x.gr.id, vg: Versions.v(x.gr.id), im: x.im, suppr: false })})
      const ok = await new SupprAvatar().run(args)
      if (!ok) {
        await afficherDiag(this.$t('SAVret' + (this.avid ? '1' : '2')))
        this.init()
      } else {
        this.ui.fD() // Dialogue de suppression
      }
    }
  },

  setup () {
    return {
      session: stores.session,
      ui: stores.ui,
      aSt: stores.avatar,
      nSt: stores.note,
      gSt: stores.groupe,
      styp, edvol, dkli
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
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
