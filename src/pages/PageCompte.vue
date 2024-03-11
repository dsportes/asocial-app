<template>
  <q-page class="column q-pa-xs splg">
    <div class="row q-my-sm items-center justify-center q-gutter-sm">
      <div> <!-- Changement de phrase secrète -->
        <q-btn class="q-ml-sm" size="md" icon="manage_accounts" no-caps
          :label="$t('CPTchps')" color="warning" dense @click="ouvrirchgps"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div> <!-- Nouvel avatar -->
        <q-btn class="q-ml-sm" size="md" icon="add" no-caps
          :label="$t('CPTnvav')" color="warning" dense @click="ouvrirNvav"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <!-- maj quotas du compte -->
      <q-btn v-if="estDelegue || estA"
        icon="settings" size="md" color="primary" padding="xs xs"
        :label="$t('CPTedq')" no-caps
        @click="editerq"/>
    </div>

    <div class="row justify-center">
    <span v-if="estA" class="q-pa-xs text-warning bg-yellow-3 text-bold">
      {{$t('compteA')}}
    </span>
    <span v-if="estDelegue" class="q-pa-xs text-warning bg-yellow-3 text-bold">
      {{$t('NPdel', [ID.court(session.partition.id)])}}
    </span>
    </div>

    <!-- Avatars du compte -->
    <q-card class="q-my-md q-pa-xs" v-for="(id, idx) in session.compte.mav" :key="id">
      <div class="row items-start">
        <div class="col-auto column items-center q-mr-sm">
          <q-btn flat icon="navigate_next" size="lg"
            :color="id === session.avatarId ? 'warning' : 'primary'" @click="courant(id)"/>
          <q-btn icon="delete" size="md" class="q-mt-sm" @click="delAvatar(id)"/>
        </div>
        <div :class="'col ' + (id === session.avatarId ? 'courant' : 'zone')">
          <apercu-avatar edit  :idav="id" :idx="idx"/>
          <div class="row q-mt-sm q-gutter-sm">
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps padding="xs xs"
              :label="$t('ACgroupes')" color="primary" dense @click="courant(id, 2)">
              <q-badge class="cl1" color="secondary" rounded>{{nbgrps(id)}}</q-badge>
            </q-btn>
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps padding="xs xs"
              :label="$t('ACseschats')" color="primary" dense @click="courant(id, 3)">
              <q-badge class="cl1" color="secondary" rounded>{{nbchats(id)}}</q-badge>
            </q-btn>
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps padding="xs xs"
              :label="$t('ACsponsorings')" color="primary" dense @click="courant(id, 4)">
              <q-badge class="cl1" color="secondary" rounded>{{nbspons(id)}}</q-badge>
            </q-btn>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de création d'un nouvel avatar -->
    <q-dialog v-model="ui.d.PCnvav" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('CPTnvav2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <nom-avatar icon-valider="check" verif :label-valider="$t('valider')" @ok-nom="oknomav" />
      </q-card>
    </q-dialog>

    <!-- Dialogue de changement de la phrase secrète -->
    <q-dialog v-model="ui.d.PCchgps" persistent>
      <q-card :class="styp('sm') + 'column items-center'">
        <div class="row q-my-md q-gutter-md justify-center items-center">
          <q-btn dense :label="$t('renoncer')" color="primary" icon="close" @click="ui.fD"/>
          <bouton-help page="page1"/>
        </div>
        <q-btn :label="$t('CPTchps2')" dense size="md" padding="xs" color="primary"
          no-caps class="titre-lg" @click="saisiePS" />
        <bouton-confirm class="q-my-md" :actif="ps !== null" :confirmer="changerps"/>
      </q-card>
    </q-dialog>

    <!-- Dialogue de suppression d'un avatar -->
    <suppr-avatar v-if="ui.d.SAsuppravatar" :avid="avid"/>

    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="ui.d.PTedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" padding="xs" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas" :groupe="estA"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense size="md" color="primary" padding="xs" icon="undo" 
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense size="md" color="primary" padding="xs" icon="check" 
            :disable="quotas.err" :label="$t('ok')" @click="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>

import stores from '../stores/stores.mjs'
import { SetQuotas, ChangementPS, NouvelAvatar, ExistePhrase } from '../app/operations.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import NomAvatar from '../components/NomAvatar.vue'
import SupprAvatar from '../panels/SupprAvatar.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { styp, afficherDiag, trapex } from '../app/util.mjs'
import { isAppExc, ID } from '../app/api.mjs'

export default {
  name: 'PageCompte',

  components: { 
    ChoixQuotas, NomAvatar, BoutonHelp, ApercuAvatar, SupprAvatar, BoutonConfirm
  },

  computed: {
    memo () { return this.aSt.compte.memo },
    estA () { return this.session.estA },
    estDelegue () { return this.session.estDelegue }
  },

  data () {
    return {
      ps: null,
      nomav: '',
      avid: 0,
      quotas: null
    }
  },

  methods: {
    async ouvrirNvav () { 
      if (await this.session.edit()) { this.ui.oD('PCnvav'); this.nomav = '' }
    },

    async ouvrirchgps () {
      try {
        // { const x = null; x.toto } // Pour tester la récupération d'un bug
        if (await this.session.edit()) { this.ui.oD('PCchgps'); this.ps = null }
      } catch (e) { trapex(e, 1) }
    },

    saisiePS () {
      this.ui.ps = { 
        orgext: this.session.org,
        verif: true,
        labelValider: 'ok',
        ok: this.okps
      }
      this.ui.oD('PSouvrir')
    },

    reset () { this.ps = null; this.ui.fD() },

    okps (ps) { 
      if (this.ps) this.ps.phrase = null
      this.ps = ps 
    },

    async changerps () {
      this.ui.fD()
      const hps1 = (this.session.ns * d14) + this.ps.hps1
      const ret = await new ExistePhrase().run(hps1, 1)
      if (isAppExc(ret)) return this.reset()
      if (ret) {
        await afficherDiag(this.$t('existe'))
        return
      }
      await new ChangementPS().run(this.ps)
      this.reset()
    },

    nbchats (id) { return this.aSt.getElt(id).chats.size },
    nbspons (id) { return this.aSt.getElt(id).sponsorings.size },
    nbgrps (id) { return this.session.compte.idGroupes(id).size },
    courant (id, action) {
      this.session.setAvatarId(id)
      if (action) switch (action){
        case 2 : { this.ui.setPage('groupesac'); return }
        case 3 : { 
          this.fSt.filtre.chats.tous = false
          this.ui.setPage('chats')
          return 
        }
        case 4 : { this.ui.setPage('sponsorings'); return }
      }
    },

    async oknomav (nom) {
      if (!nom) { this.ui.fD(); return }
      // TODO : à changer complètement
      if (this.aSt.compte.avatarDeNom(nom)) {
        await afficherDiag(this.$t('CPTndc'))
        return
      }
      this.ui.fD()
      await new NouvelAvatar().run(nom)
    },

    async editerq () {
      if (! await this.session.edit()) return
      const c = this.aSt.compta.qv
      if (this.estA) {
        this.quotas = { q1: c.q1, q2: c.q2, qc: c.qc, min1: 0, min2: 0, minc: 0,
          max1: 256,
          max2: 256,
          maxc: 256
        }
      } else {
        const s = this.aSt.tribu.synth
        this.quotas = { q1: c.q1, q2: c.q2, qc: c.qc, min1: 0, min2: 0, minc: 0,
          max1: s.q1 - s.a1 + c.q1,
          max2: s.q2 - s.a2 + c.q2,
          maxc: s.qc - s.ac + c.qc
        }
      }
      this.ui.oD('PTedq')
    },
    
    async validerq () {
      await new SetQuotas().run(this.estA ? 0 : this.aSt.tribu.id, 
        this.aSt.compta.id, [this.quotas.qc, this.quotas.q1, this.quotas.q2])
      this.ui.fD()
    },

    async delAvatar (id) {
      if (!await this.session.edit()) return
      const lna = this.session.compte.mav
      if (this.session.compteId === id) { // c'est le compte
        if (lna.size > 1) { // il reste des avatars secondaires
          await afficherDiag(this.$t('SAVer1'))
          return
        }
        this.avid = 0
      } else 
        this.avid = id
      this.ui.oD('SAsuppravatar')
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const aSt = stores.avatar
    const fSt = stores.filtre

    return {
      ui, aSt, fSt, session, styp, ID
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-btn
  padding: 2px 4px !important
.bord
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
.cl1
  position: relative
  top: -10px
  left: 5px
</style>
