<template>
  <q-page class="q-pr-sm">
    <info-restriction :niveau="3"/>
    <div class="titre-lg text-center">{{$t('P20tit', [na.nomc])}}</div>

    <div class="column items-center q-py-sm q-gutter-xs">
      <div>
        <q-btn size="md" icon="add" :label="$t('P20rdv')" color="primary" no-caps dense @click="ouvrirRdv"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div v-if="session.compte.avatarIds().size > 1">
        <q-btn class="q-ml-sm" size="md"
          icon="manage_accounts" no-caps :label="$t('P20vc')" color="primary" dense @click="voirCompta"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
    </div>

    <q-separator/>
    <div class="q-mt-lg column items-center">
      <fiche-avatar :avatar="av" :idx="0" class="moyennelargeur"/>
      <q-btn class="q-my-md" :label="$t('CVedit')" icon="edit" dense color="primary" @click="editerCV"/>
    </div>

    <q-dialog v-model="edition">
      <carte-visite :photo-init="na.photo" :info-init="na.info" :na="na"
        :close="closeCV" @ok="cvchangee"/>
    </q-dialog>
  </q-page>
</template>

<script>
// import { watch, computed } from 'vue'
import stores from '../stores/stores.mjs'
import { getNg, Cv } from '../app/modele.mjs'
import CarteVisite from '../components/CarteVisite.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import FicheAvatar from '../components/FicheAvatar.vue'
import InfoRestriction from '../components/InfoRestriction.vue'
import { MajCv } from '../app/operations.mjs'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Page20',

  components: { CarteVisite, BoutonHelp, FicheAvatar, InfoRestriction },

  computed: {
    av () { return this.session.avC },
    na () { return getNg(this.av.id) }
  },

  data () {
    return {
      comptadialobj: null
    }
  },

  methods: {
    ouvrirRdv () { },
    async voirCompta () {
      if (!await this.session.aut(4, true)) return
      const compta = stores.avatar.getCompta(this.av.id)
      stores.ui.ouvrirCompta(compta, this.na) 
    },
    editerCV () { this.edition = true },
    closeCV () { this.edition = false },
    async cvchangee (res) {
      if (res && this.na) {
        const cv = new Cv().init(this.av.id, res.ph, res.info)
        await new MajCv().run(cv)
      }
    }
  },

  data () {
    return {
      edition: false
    }
  },

  setup () {
    const session = stores.session

    return {
      session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>

