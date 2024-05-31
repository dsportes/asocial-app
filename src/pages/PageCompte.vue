<template>
  <q-page class="column q-pa-xs splg">
    <div class="row q-my-sm items-center justify-center q-gutter-sm">
      <div> <!-- Changement de phrase secrète -->
        <btn-cond class="q-ml-sm" icon="manage_accounts" no-caps cond="cUrgence"
          :label="$t('CPTchps')" color="warning" @ok="ouvrirchgps"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div> <!-- Nouvel avatar -->
        <btn-cond class="q-ml-sm" icon="add" no-caps cond="cEdit"
          :label="$t('CPTnvav')" color="warning" @ok="ouvrirNvav"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <!-- maj quotas du compte -->
      <btn-cond v-if="estDelegue || estA"
        icon="settings" :label="$t('CPTedq')" @ok="editerq" cond="cUrgence"/>
    </div>

    <div class="row justify-center">
    <span v-if="estA" class="q-pa-xs text-warning bg-yellow-3 text-bold">
      {{$t('compteA')}}
    </span>
    <span v-if="estDelegue" class="q-pa-xs text-warning bg-yellow-3 text-bold">
      {{$t('CPTdel', [ID.court(session.compte.idp)])}}
    </span>
    </div>

    <!-- Avatars du compte -->
    <q-card class="q-my-md q-pa-xs" v-for="(id, idx) in session.compte.mav" :key="id">
      <div v-if="eltav(id)" class="row items-start">
        <div class="col-auto column items-center q-mr-sm">
          <btn-cond flat icon="navigate_next" size="lg"
            :color="id === session.avatarId ? 'warning' : 'primary'" @ok="courant(id)"/>
          <btn-cond icon="delete" size="md" class="q-mt-sm" cond="cEdit"
            @ok="delAvatar(id)"/>
        </div>
        <div :class="'col ' + (id === session.avatarId ? 'courant' : 'zone')">
          <apercu-avatar edit  :idav="id" :idx="idx"/>
          <div class="row q-mt-sm q-gutter-sm">
            <btn-cond class="q-ml-sm" icon="group" cond="cVisu"
              :label="$t('ACgroupes')" @ok="courant(id, 2)"/>
            <q-badge class="cl1" color="secondary">{{nbgrps(id)}}</q-badge>
            <btn-cond class="q-ml-sm" icon="chat" cond="cVisu"
              :label="$t('ACseschats')" @ok="courant(id, 3)"/>
            <q-badge class="cl1" color="secondary">{{nbchats(id)}}</q-badge>
            <btn-cond class="q-ml-sm" icon="diversity_3" cond="cVisu"
              :label="$t('ACsponsorings')" @ok="courant(id, 4)"/>
            <q-badge class="cl1" color="secondary">{{nbspons(id)}}</q-badge>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue de création d'un nouvel avatar -->
    <q-dialog v-model="ui.d.PCnvav" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond icon="close" color="warning" @ok="ui.fD"/>
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
          <btn-cond :label="$t('renoncer')" icon="close" @ok="ui.fD"/>
          <bouton-help page="page1"/>
        </div>
        <btn-cond :label="$t('CPTchps2')" cond="cUrgence" class="titre-lg" @ok="saisiePS" />
        <bouton-confirm class="q-my-md" :actif="ps !== null" :confirmer="changerps"/>
      </q-card>
    </q-dialog>

    <!-- Dialogue de suppression d'un avatar -->
    <suppr-avatar v-if="ui.d.SAsuppravatar" :avid="avid"/>

    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="ui.d.PTedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" :quotas="quotas"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="check" :disable="quotas.err" :label="$t('valider')" @ok="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>

import stores from '../stores/stores.mjs'
import { NouvelAvatar, ChangementPS } from '../app/operations4.mjs'
import { SetQuotas } from '../app/operations4.mjs'
import { ExistePhrase } from '../app/synchro.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import NomAvatar from '../components/NomAvatar.vue'
import SupprAvatar from '../panels/SupprAvatar.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import BtnCond from '../components/BtnCond.vue'
import { styp, afficherDiag, trapex } from '../app/util.mjs'
import { isAppExc, ID, d14 } from '../app/api.mjs'
import { GetCompta, GetPartition } from '../app/synchro.mjs'

export default {
  name: 'PageCompte',

  components: { BtnCond,
    ChoixQuotas, NomAvatar, BoutonHelp, ApercuAvatar, SupprAvatar, BoutonConfirm
  },

  computed: {
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
      this.ui.oD('PCnvav')
      this.nomav = ''
    },

    async ouvrirchgps () {
      this.ui.oD('PCchgps')
      this.ps = null
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

    async changerps () { // TODO
      this.ui.fD()
      const ret = await new ExistePhrase().run(this.ps.hps1, 1)
      if (isAppExc(ret)) return this.reset()
      if (ret) {
        await afficherDiag(this.$t('existe'))
        return
      }
      await new ChangementPS().run(this.ps)
      this.reset()
    },

    eltav (id) { return this.aSt.getElt(id) },
    nbchats (id) { const e = this.eltav(id); return e ? e.chats.size : 0 },
    nbspons (id) { const e = this.eltav(id); return e ? e.sponsorings.size : 0 },
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
      if (this.session.compte.avatarDeNom(nom)) {
        await afficherDiag(this.$t('CPTndc'))
        return
      }
      await new NouvelAvatar().run(nom)
      this.ui.fD()
    },

    async editerq () {
      await new GetCompta().run()
      const c = this.session.compta
      if (this.estA) {
        this.quotas = { qn: c.qv.qn, qv: c.qv.qv, qc: 0, minn: 0, minv: 0, minc: 0,
          maxn: 256,
          maxv: 256,
          maxc: 256,
          n: c.qv.nn + c.qv.nc + c.qv.ng, v: c.qv.v,
          err: ''
        }
      } else {
        await new GetPartition().run(this.session.compte.idp)
        const s = this.session.partition.synth
        this.quotas = { qn: c.qv.qn, qv: c.qv.qv, qc: c.qv.qc, minn: 0, minv: 0, minc: 0,
        maxn: s.q.qn - s.qt.qn + c.qv.qn,
        maxv: s.q.qv - s.qt.qv + c.qv.qv,
        maxc: s.q.qc - s.qt.qc + c.qv.qc,
        n: c.qv.nn + c.qv.nc + c.qv.ng, v: c.qv.v,
        err: ''
        }
      }
      this.ui.oD('PTedq')
    },
    
    async validerq () {
      await new SetQuotas().run(this.session.compteId, this.quotas)
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
.bord
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
.cl1
  position: relative
  top: -10px
  left: -15px
</style>
