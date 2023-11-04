<template>
  <q-page class="column q-pl-xs q-mr-sm largeur40 maauto">
    <q-card class="q-my-md q-pa-xs">
      <div class="row items-center justify-around q-py-sm">
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
      </div>

      <!-- Mémo du compte -->
      <div class="q-py-sm">
        <div class="titre-md">{{$t('CPTmemo')}}</div>
        <show-html v-if="memo" class="q-ml-lg bord" maxh="5rem" :texte="memo" zoom edit
            @edit="memoeditAut"/>
        <div v-else class="q-ml-lg row">
          <div class="col fs-md text-italic">({{$t('CPTnomemo')}})</div>
          <q-btn class="col-auto" size="sm" dense icon="edit" color="primary" 
            @click="memoeditAut"/>
        </div>
      </div>

      <!-- Mots clés du compte -->
      <div class="row items-center q-my-sm">
        <div class="titre-md q-mr-md">{{$t('CPTkwc')}}</div>
        <q-btn icon="open_in_new" size="sm" color="primary" @click="mcleditAut"/>
      </div>

      <div v-if="aSt.compta.estA || aSt.compta.estSponsor" 
        class="row q-gutter-sm q-my-sm titre-lg">
        <span v-if="aSt.compta.estA" class="q-pa-xs text-warning bg-yellow-3 text-bold">{{$t('compteA')}}</span>
        <span v-if="aSt.compta.estSponsor" class="q-pa-xs text-warning bg-yellow-3 text-bold">{{$t('sponsor')}}</span>
      </div>
    </q-card>

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
            <q-btn class="q-ml-sm" size="md" icon="more" no-caps
              :label="$t('plus')" color="primary" dense @click="courant(na.id, 1)">
            </q-btn>
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps
              :label="$t('ACgroupes')" color="primary" dense @click="courant(na.id, 2)">
              <q-badge class="cl1" color="secondary" rounded>{{nbgrps(na.id)}}</q-badge>
            </q-btn>
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps
              :label="$t('ACchats')" color="primary" dense @click="courant(na.id, 3)">
              <q-badge class="cl1" color="secondary" rounded>{{nbchats(na.id)}}</q-badge>
            </q-btn>
            <q-btn class="q-ml-sm" size="md" icon="chat" no-caps
              :label="$t('ACsponsorings')" color="primary" dense @click="courant(na.id, 4)">
              <q-badge class="cl1" color="secondary" rounded>{{nbspons(na.id)}}</q-badge>
            </q-btn>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Dialogue d'édition des mots clés du compte -->
    <q-dialog v-model="mcledit" persistent>
      <mots-cles class="full-width" :duGroupe="0" @ok="okmc" :titre="$t('CPTkwc')"/>
    </q-dialog>

    <!-- Dialogue de création d'un nouvel avatar -->
    <q-dialog v-model="nvav" persistent>
      <q-card class="bs moyennelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('CPTnvav2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <nom-avatar icon-valider="check" verif :label-valider="$t('valider')" @ok-nom="oknomav" />
      </q-card>
    </q-dialog>

    <!-- Dialogue d'édition du mémo du compte -->
    <q-dialog v-model="memoedit" persistent>
      <editeur-md mh="10rem" :titre="$t('CPTmdc')" help="page1"
        :texte="aSt.compte.memo || ''" editable modetxt :label-ok="$t('OK')" @ok="memook"/>
    </q-dialog>

    <!-- Dialogue de changement de la phrase secrète -->
    <q-dialog v-model="chgps" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('CPTchps2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <phrase-secrete class="q-ma-xs" @ok="okps" verif icon-valider="check" 
            label-valider="continuer" :orgext="session.org"/>
        <q-card-actions>
          <q-btn dense :label="$t('renoncer')" color="primary" icon="close" @click="MD.fD"/>
          <q-btn dense :disable="ps===null" :label="$t('CPTvcp')" 
            color="warning" icon="check" @click="changerps"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de suppression d'un avatar -->
    <q-dialog v-model="suppravatar" persistent full-height>
      <suppr-avatar :avid="avid"/>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import { encode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { crypter } from '../app/webcrypto.mjs'
import { ChangementPS, MemoCompte, MotsclesCompte, NouvelAvatar, ExistePhrase } from '../app/operations.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import MotsCles from '../components/MotsCles.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuAvatar from '../components/ApercuAvatar.vue'
import NomAvatar from '../components/NomAvatar.vue'
import SupprAvatar from '../dialogues/SupprAvatar.vue'
import { afficherDiag, trapex } from '../app/util.mjs'
import { MD } from '../app/modele.mjs'
import { isAppExc } from '../app/api.mjs'

export default {
  name: 'PageCompte',

  components: { 
    NomAvatar, BoutonHelp, ApercuAvatar,
    PhraseSecrete, EditeurMd, ShowHtml, MotsCles, SupprAvatar
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
      if (await this.session.edit()) { this.ovnvav(); this.nomav = '' }
    },

    async ouvrirchgps () {
      try {
        // { const x = null; x.toto } // Pour tester la récupération d'un bug
        if (await this.session.edit()) { this.ovchgps(); this.ps = null }
      } catch (e) { trapex(e, 1) }
    },

    reset () { this.ps = null; MD.fD() },

    okps (ps) { this.ps = ps },

    async changerps () {
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
      return this.aSt.compte.idGroupes(null, id).size
    },
    courant (id, action) {
      this.session.setAvatarId(id)
      if (action) switch (action){
        case 1 : { MD.oD('detailsavatar'); return }
        case 2 : { this.ui.setPage('groupesac'); return }
        case 3 : { this.ui.setPage('chats'); return }
        case 4 : { this.ui.setPage('sponsorings'); return }
      }
    },

    async oknomav (nom) {
      try {
        if (!nom) { this.nvav = false; return }
        if (this.aSt.compta.avatarDeNom(nom)) {
          await afficherDiag(this.$t('CPTndc'))
          return
        }
      } catch (e) { trapex(e, 2) }
      MD.fD()
      await new NouvelAvatar().run(nom)
    },

    async memoeditAut () { if (await this.session.edit()) this.ovmemoedit() },

    async memook (m) {
      const memok = await crypter(this.session.clek, m)
      await new MemoCompte().run(memok)
      MD.fD()
    },

    async mcleditAut () { if (await this.session.edit()) this.ovmcledit() },

    async okmc (mmc) {
      MD.fD()
      if (mmc !== false) {
        const mck = await crypter(this.session.clek, new Uint8Array(encode(mmc)))
        await new MotsclesCompte().run(mck)
      }
    },

    async delAvatar (id) {
      if (await this.session.edit()) {
        const lna = this.aSt.compte.lstAvatarNas
        if (this.session.compteId === id) { // c'est le compte
          if (lna.length > 1) { // il reste des avatars secondaires
            await afficherDiag(this.$t('SAVer1'))
            return
          }
          this.avid = 0
        } else 
          this.avid = id
        this.ovsuppravatar()
      }
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar

    const mcledit = ref(false)
    function ovmcledit () { MD.oD(mcledit) }
    const nvav = ref(false)
    function ovnvav () { MD.oD(nvav) }
    const memoedit = ref(false)
    function ovmemoedit () { MD.oD(memoedit) }
    const chgps = ref(false)
    function ovchgps () { MD.oD(chgps) }
    const suppravatar = ref(false)
    function ovsuppravatar () { MD.oD(suppravatar) }

    return {
      MD, mcledit, ovmcledit, nvav, ovnvav, memoedit, ovmemoedit, chgps, ovchgps,
      suppravatar, ovsuppravatar,
      ui: stores.ui,
      aSt,
      session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
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
