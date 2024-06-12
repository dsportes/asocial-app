<template>
<q-dialog v-model="ui.d.SAsuppravatar" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @click="ui.fD"/>
      <q-toolbar-title v-if="avid!==0" class="titre-lg full-width text-center">{{$t('SAVtit1', [cv.nom])}}</q-toolbar-title>
      <q-toolbar-title v-else class="titre-lg full-width text-center msg">
        {{$t('SAVtit2', [cv.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <div class="row justify-center items-center">
      <div class="titre-md text-bold text-italic q-mr-md">{{$t('SAVval' + (avid !== 0 ? '1' : '2'))}}</div>
      <bouton-confirm :actif="checksOK" :confirmer="cftop"/>
    </div>
  </q-header>

  <q-page-container>
    <q-page v-if="s" :class="dkli(0) + ' q-pa-xs'">

      <div v-if="s.ddel" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._ddel" :label="$t('vu')" />
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
            <span v-for="c in s.ch" :key="c.pk" class="q-my-sm q-mr-sm b1">
              {{session.getCV(c.idE).nomC}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.sp.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" v-model="checks._spons" :label="$t('vu')" />
        <div class="col">
          <div class="titre-md">{{$t('SAVspons', s.sp.length, { count: s.sp.length })}}</div>
          <div class="q-ml-md">
            <span v-for="x in s.sp" :key="x.ids" class="q-my-sm q-mr-sm b1">{{x.psp}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr1.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr1" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr1', s.gr1.length, { count: s.gr1.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr1" :key="x.id">
            <span class="b1 q-mr-lg">{{x.nomC}}</span>
            <span>{{$t('SAVvlib1', x.nn, {count: x.nn})}}</span>
            <span class="q-ml-sm">{{$t('SAVvlib', [edvol(x.v2)])}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr2.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr2" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr2', s.gr2.length, { count: s.gr2.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr2" :key="x.id">
            <span class="b1 q-mr-lg">{{x.nomC}}</span>
            <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
            <span class="q-ml-sm">{{$t('SAVvlib3m', [edvol(x.v2)])}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr3.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr3" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr3', s.gr3.length, { count: s.gr3.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr3" :key="x.id">
            <span class="b1 q-mr-lg">{{x.nomC}}</span>
            <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
          </div>
        </div>
      </div>

      <div v-if="s.gr0.length" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr0" :label="$t('vu')" />
        <div class="col column">
          <div class="titre-md">{{$t('SAVgr0', s.gr0.length, { count: s.gr0.length })}}</div>
          <div class="q-ml-md q-my-sm" v-for="x in s.gr0" :key="x.id">
            <span class="b1 q-mr-lg">{{x.nomC}}</span>
            <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
          </div>
        </div>
      </div>

      <div v-if="avid !== 0" class="row q-my-md items-start">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks._vol" :label="$t('vu')" />
        <div class="col">
          <div v-if="nbn" class="titre-md">{{$t('SAVvol')}}</div>        
          <div v-if="s.nna" class="q-ml-lg q-my-sm">{{$t('SAVvola', [s.nna, edvol(s.v2a)])}}</div>
          <div v-if="s.nng" lass="q-ml-lg q-my-sm">{{$t('SAVvolg', [s.nng, edvol(s.v2g)])}}</div>
          <div class="titre-md">{{$t('SAVabo')}}</div>        
          <div class="q-ml-md q-my-sm">
            {{$t('SAVabo1', [nbn, s.ch.length, s.ng, nbtot])}}</div>
          <div v-if="s.v2a" class="q-ml-md q-my-sm">
            {{$t('SAVabo2', [edvol(s.v2a)])}}</div>
        </div>
      </div>

    </q-page>
  </q-page-container>

  <q-dialog v-model="ui.d.SAconfirmsuppr" persistent>
    <q-card :class="styp('sm') + 'q-pa-sm'">
      <div class="q-mt-md titre-lg text-italic">{{$t('SAVcf' + (avid !== 0 ? '1' : '2'))}}</div>
      <div class="q-mt-md row justify-center q-gutter-md">
        <btn-cond flat :label="$t('renoncer')" color="primary" @click="ui.fD"/>
        <bouton-confirm actif :confirmer="valider"/>
      </div>
    </q-card>
  </q-dialog>

</q-layout>
</q-dialog>
</template>

<script>
import { toRef } from 'vue'

import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { styp, edvol, sleep, dkli } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import { SupprAvatar, SupprCompte } from '../app/operations4.mjs'
import { GetPartition, deconnexion } from '../app/synchro.mjs'

export default ({
  name: 'SupprAvatar',

  props: { avid: Number },

  components: { BoutonHelp, BoutonConfirm, BtnCond },

  computed: {
    cv () { return this.session.getCV(this.avid || this.session.compteId) },

    checksOK () { 
      for (const x in this.s.checks) 
        if (this.s.checks[x] && !this.checks[x]) return false
      return true 
    },

    nbn () { return this.s.nna + this.s.nng },

    nbtot () { return this.nbn + this.s.ch.length + this.s.ng },

    v2n () { return this.s.v2a + this.s.v2g },

    s () { 
      const s = {
        checks: { 
          _notes: false, _chats: false, _spons: false, _ddel: false, _vol: false,
          _gr0: false, _gr1: false, _gr2: false, _gr3: false 
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

        nng: 0, // nombre total de notes des groupes disparaissant
        v2g: 0, // v2 total des fichiers des notes des groupes disparaissant

        nna: 0, // nombre total des notes de l'avatar
        v2a: 0, // v2 total des fichiers des notes de l'avatar

        // résiliation compte
        ddel: false // dernier délégué de sa partition
      }

      const id = this.avid || this.session.compteId
      s.nng = 0; s.v2g = 0; s.ng = 0
      s.stats = this.nSt.statsParRacine

      const a = s.stats[id]
      s.nna = a.nn; s.v2a = a.v2

      const e = this.aSt.getElt(id)

      e.chats.forEach(c => { if (c.stI === 1) s.ch.push(c) })
      if (s.ch.length) s.checks._chats = true

      e.sponsorings.forEach(sp => { if (sp.st === 0) s.sp.push(sp) })
      if (s.sp.length) s.checks._spons = true

      for (const [idg, sav] of this.session.compte.mpg) {
        if (!sav.has(id)) continue
        s.ng++
        const gr = this.gSt.egr(idg).groupe
        const im = gr.mmb.get(id)
        const x = {
          nomC: this.session.getCV(gr.id).nomC,
          nn: gr.nn,
          v2: gr.vf,
          heb: false,
          nnh: 0,
          v2h: 0
        }
        if (gr.imh === im) { x.heb = true; x.nnh = x.nn; x.v2h = x.v2 } 
        
        let nan = 0, nac = 0, estAn = false, estAc = false
        for (let i = 1; i < gr.st.length; i++) {
          const s = gr.st[i]
          if (s === 5) { nan++; if (i === x.im) estAn = true }
          if (s >= 4) { nac++; if (i === x.im) estAc = true }
        }
        x.dan = nan === 1 && estAn
        x.dac = nac === 1 && estAc
        if (x.dac) {
          s.nng += x.nn
          s.v2g += x.v2
        }
        
        x.st = x.dac ? 1 : (x.heb ? 2 : (x.dan ? 3 : 0))
        s['gr' + x.st] = x
      }

      if (s.nna + s.nng) s.checks._notes = true

      for (let i = 0; i < 4; i++) if (s['gr' + i].length) s.checks['_gr' + i] = true

      if (this.avid === 0 && this.session.compte.idp) {
        const ndel = this.session.partition.nbDels
        if (ndel === 1 && this.session.compte.del) { s.ddel = true; s.checks._ddel = true }
      }
      if (this.avid)  s.checks._vol = true // Abonnements - sans intéret si le compte est résilié

      return s
    }
  },

  data () {
    return {
      checks: { 
        _notes: false, _chats: false, _spons: false, _ddel: false, _vol: false,
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

    async valider () {
      this.ui.fD() // boite de confirmation
      await sleep(50)
      this.ui.fD() // Dialogue de suppression
      if (this.avid) {
        const r = await new SupprAvatar().run(this.avid)
        if (r) await afficher8000(r, 0, avid)
      } else {
        const r = await new SupprCompte().run()
        if (r) await afficherDiag(this.$t('SAcptdisp'))
        deconnexion()
      }
    }
  },

  setup (props) {
    const session = stores.session
    const avid = toRef(props, 'avid')

    if (!avid.value && session.compte.idp)
      onMounted(async () => { await new GetPartition().run(session.compte.idp) })

    return {
      session,
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
