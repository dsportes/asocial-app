<template>
<q-dialog v-model="ui.nouvelAvatar" persistent>
  <q-card class="moyennelargeur">
    <q-card-section>
      <div class="titre-lg">{{$t('CPTnvav2')}}</div>
      <nom-avatar icon-valider="check" verif 
        :label-valider="$t('valider')" @ok-nom="oknom" />
      <q-separator/>
      <div v-if="nomav">
        <div class="titre-md">{{$t('CPTchq')}}</div>
        <div :class="'font-mono' + (mx1 ? ' text-negative bg-yellow-5' : '')">{{$t('CPTmx1', [mxff[0]])}}</div>
        <div :class="'font-mono' + (mx2 ? ' text-negative bg-yellow-5' : '')">{{$t('CPTmx2', [mxff[1]])}}</div>
        <choix-forfaits v-model="forfaits" :f1="1" :f2="1"/>
      </div>
    </q-card-section>
    <q-card-actions>
      <q-btn flat dense color="primary" icon="close" :label="$t('renoncer')" @click="ui.nouvelAvatar=false" />
      <q-btn flat dense color="warning" :disable="!nomav || mx1 || mx2 || err" 
        icon="add" :label="$t('CPTnvav3')" @click="nvAvatar"/>
    </q-card-actions>
  </q-card>
</q-dialog>
</template>

<script>
import { CreationAvatar } from '../app/operations.mjs'
import ChoixForfaits from './ChoixForfaits.vue'
import NomAvatar from './NomAvatar.vue'
import stores from '../stores/stores.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'

export default {
  name: 'NouvelAvatar',

  components: { ChoixForfaits, NomAvatar },

  watch: {
    forfaits (f) {
      this.mx1 = f[0] > this.mxff[0]
      this.mx2 = f[1] > this.mxff[1]
      this.err = f[0] < 0 || f[0] > 255 || f[1] < 0 || f[1] > 255
    }
  },

  data () {
    return {
      mx1: false,
      mx2: false,
      nomav: '',
      forfaits: [1, 1],
      err: false
    }
  },

  methods: {
    async oknom (nom) {
      const ida = this.session.compte.avatarDeNom(nom)
      if (ida) {
        await this.session.afficherDiag(this.$t('CPTndc'))
      } else this.nomav = nom
    },
    async nvAvatar () {
      await new CreationAvatar().run(this.nomav, this.forfaits)
      this.ui.nouvelAvatar = false
    }
  },

  setup() {
    const session = stores.session
    const c = stores.avatar.getCompta(session.compte.id).compteurs
    const mxff = [
      Math.floor(((c.f1 * UNITEV1) - c.v1) / UNITEV1) - 1,
      Math.floor(((c.f2 * UNITEV2) - c.v2) / UNITEV2) - 1
    ]

    return {
      ui: stores.ui,
      session,
      mxff
    }
  },
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-bottom:  1px solid $grey-5
  border-top:  1px solid $grey-5
</style>
