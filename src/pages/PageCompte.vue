<template>
  <q-page class="column q-pa-xs splg">
    <div class="column items-center justify-center q-gutter-xs">
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
      <!-- mots clés du compte -->
      <q-btn icon="open_in_new" size="md" color="primary" padding="xs xs"
        :label="$t('CPTkwc')" no-caps
        @click="mcleditAut"/>
    </div>

    <div v-if="aSt.compta.estA || aSt.compta.estSponsor" 
      class="row q-gutter-sm q-my-sm titre-lg">
      <span v-if="aSt.compta.estA" class="q-pa-xs text-warning bg-yellow-3 text-bold">{{$t('compteA')}}</span>
      <span v-if="aSt.compta.estSponsor" class="q-pa-xs text-warning bg-yellow-3 text-bold">{{$t('sponsor')}}</span>
    </div>

    <!-- Avatars du compte -->
    <q-card class="q-my-md q-pa-xs" v-for="(na, idx) in aSt.compte.lstAvatarNas" :key="na.id">
      <div class="row items-start">
        <div class="col-auto column items-center q-mr-sm">
          <q-btn flat icon="navigate_next" size="lg"
            :color="na.id === session.avatarId ? 'warning' : 'primary'" @click="courant(na.id)"/>
          <q-btn icon="delete" size="md" class="q-mt-sm" @click="delAvatar(na.id)"/>
        </div>
        <div :class="'col ' + (na.id === session.avatarId ? 'courant' : 'zone')">
          <apercu-avatar edit  :idav="na.id" :idx="idx"/>
          <div class="row q-mt-sm q-gutter-sm">
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps padding="xs xs"
              :label="$t('ACgroupes')" color="primary" dense @click="courant(na.id, 2)">
              <q-badge class="cl1" color="secondary" rounded>{{nbgrps(na.id)}}</q-badge>
            </q-btn>
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps padding="xs xs"
              :label="$t('ACseschats')" color="primary" dense @click="courant(na.id, 3)">
              <q-badge class="cl1" color="secondary" rounded>{{nbchats(na.id)}}</q-badge>
            </q-btn>
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps padding="xs xs"
              :label="$t('ACsponsorings')" color="primary" dense @click="courant(na.id, 4)">
              <q-badge class="cl1" color="secondary" rounded>{{nbspons(na.id)}}</q-badge>
            </q-btn>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue d'édition des mots clés du compte -->
    <mots-cles v-if="ui.d.MCmcledit"/>

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

  </q-page>
</template>

<script>
import { encode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { crypter } from '../app/webcrypto.mjs'
import { ChangementPS, MotsclesCompte, NouvelAvatar, ExistePhrase } from '../app/operations.mjs'
import MotsCles from '../dialogues/MotsCles.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import NomAvatar from '../components/NomAvatar.vue'
import SupprAvatar from '../panels/SupprAvatar.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { styp, afficherDiag, trapex } from '../app/util.mjs'
import { isAppExc } from '../app/api.mjs'

export default {
  name: 'PageCompte',

  components: { 
    NomAvatar, BoutonHelp, ApercuAvatar, MotsCles, SupprAvatar, BoutonConfirm
  },

  computed: {
    memo () { return this.aSt.compte.memo }
  },

  data () {
    return {
      ps: null,
      memoed: null,
      nomav: '',
      avid: 0
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
      const ret = await new ExistePhrase().run(this.ps.hps1, 1)
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
    nbgrps (id) { 
      return this.aSt.compte.idGroupes(id).size
    },
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
      if (this.aSt.compte.avatarDeNom(nom)) {
        await afficherDiag(this.$t('CPTndc'))
        return
      }
      this.ui.fD()
      await new NouvelAvatar().run(nom)
    },

    async mcleditAut () { if (await this.session.edit()) this.ui.oD('MCmcledit') },

    async okmc (mmc) {
      if (mmc !== false) {
        const mck = await crypter(this.session.clek, new Uint8Array(encode(mmc)))
        await new MotsclesCompte().run(mck)
      }
    },

    async delAvatar (id) {
      if (!await this.session.edit()) return
      const lna = this.aSt.compte.lstAvatarNas
      if (this.session.compteId === id) { // c'est le compte
        if (lna.length > 1) { // il reste des avatars secondaires
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

    /*
    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar' || name === 'setCompte' || name === 'del') {
          // ???
        }
      })
    })
    */

    return {
      ui, aSt, fSt, session, styp
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
